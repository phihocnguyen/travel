import "server-only";
import { writeImage } from "@/lib/storage/images";
import { getDatabase } from "@/lib/db";
import { TicketValidationError } from "./validation";
import { colorPrintPng } from "./print-image";

export async function operateTicket(id: string, actorId: string, input: {action?: unknown; image?: unknown; expectedUpdatedAt?: unknown}) {
  const action = input.action;
  if (!["start","render","printed","cancel","collect"].includes(String(action))) throw new TicketValidationError("Thao tác không hợp lệ.");
  const client = await getDatabase().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT * FROM tickets WHERE id=$1 FOR UPDATE",[id]);
    const ticket = result.rows[0];
    if (!ticket) throw new TicketValidationError("Không tìm thấy vé.");
    const event = (await client.query("SELECT id FROM events WHERE campaign_id=$1 AND slug='tram-hen-cao-lanh'",[ticket.campaign_id])).rows[0];
    if (!event) throw new TicketValidationError("Sự kiện chưa được cấu hình.");
    const latest = (await client.query("SELECT * FROM ticket_print_jobs WHERE ticket_id=$1 AND event_id=$2 ORDER BY created_at DESC LIMIT 1 FOR UPDATE",[id,event.id])).rows[0];
    if (action === "start" || action === "render") {
      if (action === "start" && latest && ["processing","printed"].includes(latest.status)) throw new TicketValidationError("Vé đã có lệnh in. Xác nhận hoặc hủy lệnh hiện tại trước.");
      if (action === "render" && (!latest || !["processing","printed"].includes(latest.status))) throw new TicketValidationError("Chưa có lệnh in để tạo lại file.");
      if (input.expectedUpdatedAt !== new Date(ticket.updated_at).toISOString()) throw new TicketValidationError("User vừa cập nhật vé. Hãy tải lại trước khi in.");
      const match = typeof input.image === "string" ? /^data:image\/png;base64,([a-z0-9+/=]+)$/i.exec(input.image) : null;
      if (!match) throw new TicketValidationError("Không có file PNG hợp lệ để in.");
      let png: Buffer = Buffer.from(match[1],"base64");
      if (png.length > 16*1024*1024 || !png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new TicketValidationError("File in không hợp lệ hoặc vượt 16MB.");
      try { png = await colorPrintPng(png); }
      catch { throw new TicketValidationError("File in phải là PNG chất lượng cao, tối thiểu 1417 × 827 px đúng tỷ lệ vé. Hãy chuẩn bị lại file in."); }
      const filePath = await writeImage("ticket-outputs", png);
      await client.query(`INSERT INTO ticket_outputs(ticket_id,design_updated_at,file_path) VALUES ($1,$2,$3)
        ON CONFLICT(ticket_id) DO UPDATE SET design_updated_at=EXCLUDED.design_updated_at,file_path=EXCLUDED.file_path,image_data=NULL,created_at=now()`,[id,ticket.updated_at,filePath]);
      if (action === "start") {
        if (latest?.status === "queued") await client.query("UPDATE ticket_print_jobs SET status='processing',processed_by=$2,started_at=now(),attempts=attempts+1 WHERE id=$1",[latest.id,actorId]);
        else await client.query("INSERT INTO ticket_print_jobs(ticket_id,event_id,status,requested_by,processed_by,started_at,attempts) VALUES ($1,$2,'processing',$3,$3,now(),1)",[id,event.id,actorId]);
      }
    } else if (action === "printed") {
      if (!latest || !["processing","printed"].includes(latest.status)) throw new TicketValidationError("Chưa có lệnh in đang xử lý.");
      await client.query("UPDATE ticket_print_jobs SET status='printed',completed_at=coalesce(completed_at,now()) WHERE id=$1",[latest.id]);
    } else if (action === "cancel") {
      if (!latest || !["queued","processing"].includes(latest.status)) throw new TicketValidationError("Chỉ có thể hủy lệnh chưa hoàn tất.");
      await client.query("UPDATE ticket_print_jobs SET status='cancelled',completed_at=now() WHERE id=$1",[latest.id]);
    } else {
      if (!latest || latest.status !== "printed") throw new TicketValidationError("Cần xác nhận đã in trước khi trao vé.");
      const collection = await client.query("INSERT INTO ticket_collections(ticket_id,event_id,print_job_id,verified_by) VALUES ($1,$2,$3,$4) ON CONFLICT(ticket_id,event_id) DO NOTHING RETURNING id",[id,event.id,latest.id,actorId]);
      if (!collection.rowCount) throw new TicketValidationError("Vé này đã được trao. Không trao trùng.");
    }
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES ($1,$2,'ticket',$3)",[actorId,`ticket.${action}`,id]);
    await client.query("COMMIT");
    return {ok:true};
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally {client.release();}
}
