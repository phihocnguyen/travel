import "server-only";
import { getDatabase } from "@/lib/db";
import type { PoolClient } from "pg";
import { normalizeInput, parseDataUrl, TicketValidationError } from "./validation";
import type { TicketDesign, TicketInput } from "./types";
export { TicketValidationError } from "./validation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT = `SELECT t.*, EXISTS(SELECT 1 FROM ticket_images i WHERE i.ticket_id=t.id) AS has_image,
 EXISTS(SELECT 1 FROM ticket_print_jobs p WHERE p.ticket_id=t.id AND p.status IN ('processing','printed'))
 OR EXISTS(SELECT 1 FROM ticket_collections c WHERE c.ticket_id=t.id) AS print_locked FROM tickets t`;
type Row = Record<string, unknown>;
function design(row: Row): TicketDesign {
  const updatedAt = new Date(row.updated_at as string).toISOString();
  return {
    id: String(row.id), code: String(row.ticket_code), title: String(row.title), from: String(row.sender_name), to: String(row.recipient_name), message: String(row.message),
    layout: row.layout as TicketDesign["layout"], theme: row.theme as TicketDesign["theme"], stickers: row.stickers as TicketDesign["stickers"],
    titleTransform: row.title_transform as TicketDesign["titleTransform"], textTransform: row.text_transform as TicketDesign["textTransform"],
    image: { ...(row.image_transform as TicketDesign["image"]), url: row.has_image ? `/api/tickets/${row.id}/image?v=${encodeURIComponent(updatedAt)}` : null },
    createdAt: new Date(row.created_at as string).toISOString(), updatedAt, printLocked: Boolean(row.print_locked),
  };
}
export async function listTickets(subject: string): Promise<TicketDesign[]> {
  const rows = await getDatabase().query(`${SELECT} JOIN users u ON u.id=t.user_id WHERE u.auth_subject=$1 AND t.status<>'archived'`, [subject]);
  return rows.rows.map(design);
}
export async function getTicket(subject: string, id: string): Promise<TicketDesign | null> {
  if (!UUID.test(id)) return null;
  const rows = await getDatabase().query(`${SELECT} JOIN users u ON u.id=t.user_id WHERE u.auth_subject=$1 AND t.id=$2`, [subject,id]);
  return rows.rows[0] ? design(rows.rows[0]) : null;
}
async function saveImage(client: PoolClient, id: string, input: TicketInput) {
  if (typeof input.imageDataUrl === "string") {
    const image = parseDataUrl(input.imageDataUrl);
    const png = image.buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const jpeg = image.buffer[0]===255 && image.buffer[1]===216 && image.buffer[2]===255;
    if (!(image.contentType === "image/png" ? png : jpeg)) throw new TicketValidationError("Nội dung ảnh không đúng định dạng.");
    await client.query(`INSERT INTO ticket_images(ticket_id,content_type,image_data) VALUES ($1,$2,$3)
      ON CONFLICT(ticket_id) DO UPDATE SET content_type=EXCLUDED.content_type,image_data=EXCLUDED.image_data,updated_at=now()`, [id,image.contentType,image.buffer]);
  } else if (input.removeImage) await client.query("DELETE FROM ticket_images WHERE ticket_id=$1", [id]);
}
async function persist(subject: string, id: string | null, value: unknown): Promise<TicketDesign | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TicketValidationError("Thiết kế không hợp lệ.");
  const input = value as TicketInput & { expectedUpdatedAt?: string };
  const normalized = normalizeInput(value);
  if (!normalized.title) throw new TicketValidationError("Nhập tiêu đề vé trước khi lưu.");
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    // Serialize all creates/edits for one identity before allocating a code.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [subject]);
    const user = await client.query("SELECT id FROM users WHERE auth_subject=$1 AND status='active'", [subject]);
    if (!user.rows[0]) throw new TicketValidationError("Tài khoản chưa sẵn sàng hoặc đã bị khóa.");
    const existing = await client.query("SELECT * FROM tickets WHERE user_id=$1 FOR UPDATE", [user.rows[0].id]);
    const current = existing.rows[0];
    if (id && (!current || current.id !== id)) { await client.query("ROLLBACK"); return null; }
    // Retrying a create returns the existing ticket; it never overwrites another tab.
    if (!id && current) {
      const result = await client.query(`${SELECT} WHERE t.id=$1`, [current.id]);
      await client.query("COMMIT"); return design(result.rows[0]);
    }
    if (id && (!input.expectedUpdatedAt || new Date(current.updated_at).toISOString() !== input.expectedUpdatedAt)) {
      throw new TicketValidationError("Vé đã thay đổi ở phiên khác. Hãy tải lại trang trước khi lưu.");
    }
    const fields = [normalized.title,normalized.from,normalized.to,normalized.message,normalized.layout,JSON.stringify(normalized.theme),JSON.stringify(normalized.stickers),JSON.stringify(normalized.image),JSON.stringify(normalized.titleTransform),JSON.stringify(normalized.textTransform)];
    let ticketId = id;
    if (id) {
      await client.query(`UPDATE tickets SET title=$1,sender_name=$2,recipient_name=$3,message=$4,layout=$5,theme=$6,stickers=$7,image_transform=$8,title_transform=$9,text_transform=$10,status='saved' WHERE id=$11`, [...fields,id]);
    } else {
      const campaign = await client.query("SELECT id FROM campaigns WHERE slug='vi-xoai-dan-loi'");
      if (!campaign.rows[0]) throw new TicketValidationError("Chiến dịch chưa được cấu hình.");
      const result = await client.query(`INSERT INTO tickets(title,sender_name,recipient_name,message,layout,theme,stickers,image_transform,title_transform,text_transform,user_id,campaign_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [...fields,user.rows[0].id,campaign.rows[0].id]);
      ticketId = result.rows[0].id;
    }
    await saveImage(client, ticketId!, { ...normalized, removeImage: true });
    const result = await client.query(`${SELECT} WHERE t.id=$1`, [ticketId]);
    await client.query("COMMIT");
    return design(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    const message = error instanceof Error ? error.message : "";
    if (message.includes("TICKET_CAPACITY_REACHED")) throw new TicketValidationError("Đã cấp đủ 1.000 mã vé VXDL000–VXDL999. Hiện không thể tạo thêm vé.");
    if (message.includes("TICKET_PRINT_LOCKED")) throw new TicketValidationError("Vé đang in, đã in hoặc đã trao nên không thể thay đổi thiết kế.");
    throw error;
  } finally { client.release(); }
}
export async function createTicket(subject: string, value: unknown): Promise<TicketDesign> { return (await persist(subject,null,value))!; }
export async function updateTicket(subject: string, id: string, value: unknown): Promise<TicketDesign | null> { if (!UUID.test(id)) return null; return persist(subject,id,value); }
export async function deleteTicket(subject: string, id: string): Promise<boolean> { void subject; void id; throw new TicketValidationError("Mỗi tài khoản có một mã vé cố định. Bạn có thể chỉnh sửa vé thay vì xóa và cấp mã mới."); }
export async function readTicketImage(subject: string, id: string, admin = false): Promise<{data: Buffer; contentType: "image/jpeg" | "image/png"} | null> {
  if (!UUID.test(id)) return null;
  const result = await getDatabase().query(`SELECT i.image_data,i.content_type FROM ticket_images i JOIN tickets t ON t.id=i.ticket_id JOIN users u ON u.id=t.user_id WHERE t.id=$1 AND ($3::boolean OR u.auth_subject=$2)`, [id,subject,admin]);
  return result.rows[0] ? { data: result.rows[0].image_data, contentType: result.rows[0].content_type } : null;
}
export async function listAdminTickets(query = ""): Promise<(TicketDesign & {ownerName: string; ownerEmail: string | null; printed: boolean; collected: boolean; printStatus: string | null})[]> {
  const result = await getDatabase().query(`${SELECT} JOIN users u ON u.id=t.user_id WHERE ($1='' OR t.ticket_code=$1) ORDER BY t.created_at DESC LIMIT 100`, [query.trim().toUpperCase()]);
  const ids = result.rows.map((row) => row.id);
  if (!ids.length) return [];
  const owners = await getDatabase().query(`SELECT t.id,u.display_name,u.email,EXISTS(SELECT 1 FROM ticket_print_jobs p WHERE p.ticket_id=t.id AND p.status='printed') AS printed,EXISTS(SELECT 1 FROM ticket_collections c WHERE c.ticket_id=t.id) AS collected,(SELECT status FROM ticket_print_jobs p WHERE p.ticket_id=t.id ORDER BY created_at DESC LIMIT 1) AS print_status FROM tickets t JOIN users u ON u.id=t.user_id WHERE t.id=ANY($1::uuid[])`, [ids]);
  return result.rows.map((row) => { const owner = owners.rows.find((item)=>item.id===row.id); return {...design(row),ownerName:owner.display_name,ownerEmail:owner.email,printed:owner.printed,collected:owner.collected,printStatus:owner.print_status}; });
}
export async function getAdminTicket(id: string): Promise<TicketDesign | null> {
  if (!UUID.test(id)) return null;
  const result = await getDatabase().query(`${SELECT} WHERE t.id=$1`,[id]);
  return result.rows[0] ? design(result.rows[0]) : null;
}
