import "server-only";
import { type AIMessage } from "@/lib/ai/client";
import type { ChatAnswer } from "./types";

export const SCOPE_REFUSAL: ChatAnswer = {
  text: "Xoài chỉ hỗ trợ nội dung của website Vị Xoài Dẫn Lối: khám phá Cao Lãnh, lịch trình, Trạm Hẹn Cao Lãnh, vé, trò chơi và cộng đồng. Bạn chọn một chủ đề bên dưới nhé! 🥭",
};
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const topic = /\b(cao lanh|dong thap|vi xoai|xoai|tram hen|xeo quyt|gao giong|my phuoc thanh|nguyen sinh sac|do cong tuong|tan thuan dong|tap ket|website|trang web|trang chu|ban do|lich trinh|ke hoach|planning|khach san|hotel|homestay|farmstay|luu tru|gia phong|dat phong|chi phi|ngan sach|du lich|su kien|dat ve|tao ve|ve hen|ve cua toi|gia ve|dang nhap|tai khoan|mat khau|dashboard|checkpoint|nhiem vu|tro choi|mini ?game|cheo (thuyen|xuong)|thap nhang|dang hoa|hai xoai|goi banh|cau ca|tam sen|ugc|cover|hat co vibe|buc tranh rang ngoi|binh chon|du thi|the le|giai thuong|hashtag|hat moc|dem dan|song ca|video|cong dong|bai viet|thu vien anh|upload)\b/;
const forbidden = /\b(ignore|disregard|override|system prompt|developer message|jailbreak|prompt injection|bo qua (chi dan|huong dan|quy tac)|quen (chi dan|huong dan)|dong vai|nhap vai|lap trinh|viet code|viet ma|python|javascript|sql|giai (toan|phuong trinh|bai tap)|chung khoan|crypto|bitcoin|chan doan|chua benh|chinh tri|khieu dam|vu khi|hack|ma doc)\b/;
const followup = /^(?:di |cho (?:minh|toi|em) |minh muon |toi muon |vay |the )?(?:(?:1|2|3|mot|hai|ba) ngay(?: (?:1|2|mot|hai) dem)?|bao nhieu tien|o dau|khi nao|may gio|nhu the nao|huong dan them|chi tiet hon|tiep tuc|co anh khong|gia bao nhieu|con ve khong|dat o dau)[?!.\s]*$/;

export function localScope(history: AIMessage[]): "allow" | "block" | "greeting" {
  const question = normalize(history.at(-1)?.content ?? "");
  if (forbidden.test(question)) return "block";
  if (/^(xin chao|chao(?: (?:ban|xoai))?|hello|hi|cam on(?: (?:ban|xoai))?)[!.,\s]*$/.test(question)) return "greeting";
  if (topic.test(question)) return "allow";
  if (question.length<240 && /\d|nguoi|khach|ngay|dem|trieu|ngan sach|budget|linh hoat|mot minh/.test(question) && history.slice(0,-1).some(message=>message.role==="user"&&topic.test(normalize(message.content))&&!forbidden.test(normalize(message.content)))) return "allow";
  if (followup.test(question) && history.slice(0,-1).some(message => message.role === "user" && topic.test(normalize(message.content)) && !forbidden.test(normalize(message.content)))) return "allow";
  return "block";
}
