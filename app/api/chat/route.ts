import { AIError, type AIMessage } from "@/lib/ai/client";
import { answerChat } from "@/lib/chat/answer";
import { localScope, SCOPE_REFUSAL, withinWebsiteScope } from "@/lib/chat/scope";
import { tripIntake } from "@/lib/chat/research";

export const maxDuration = 120;
const requests = new Map<string, { count: number; until: number }>();
let inFlight = 0;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== process.env.NEXT_PUBLIC_SITE_URL) return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 16000) return Response.json({ error: "Cuộc trò chuyện quá dài. Bạn bắt đầu lại nhé." }, { status: 413 });
  let body;
  try { body = JSON.parse(raw); } catch { return Response.json({ error: "Câu hỏi không hợp lệ." }, { status: 400 }); }
  const messages = body?.messages;
  if (!Array.isArray(messages) || !messages.length || messages.length > 12 || messages.at(-1)?.role !== "user" || messages.some(message => !message || !["user","assistant"].includes(message.role) || typeof message.content !== "string" || !message.content.trim() || message.content.length > 4000)) return Response.json({ error: "Câu hỏi không hợp lệ hoặc quá dài." }, { status: 400 });
  const now = Date.now();
  for (const [key, value] of requests) if (value.until <= now) requests.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const entry = requests.get(ip) || { count: 0, until: now + 60_000 };
  if (entry.count >= 12 || inFlight >= 8 || (requests.size >= 2000 && !requests.has(ip))) return Response.json({ error: "Xoài đang nhận nhiều câu hỏi. Bạn thử lại sau một chút nhé." }, { status: 429, headers: { "Retry-After": "60" } });
  entry.count++; requests.set(ip, entry); inFlight++;
  let stage="scope";
  try {
    const safeMessages: AIMessage[] = messages.map(message => ({ role: message.role, content: message.content }));
    const scope = localScope(safeMessages);
    if (scope === "block") return Response.json(SCOPE_REFUSAL, { headers: { "Cache-Control": "no-store" } });
    if (scope === "greeting") return Response.json({text:"Chào bạn, mình là Xoài! 🥭 Mình có thể giúp bạn khám phá website Vị Xoài Dẫn Lối, lên lịch trình Cao Lãnh, tìm sự kiện và hướng dẫn tạo vé. Bạn muốn tìm hiểu phần nào?"}, { headers: { "Cache-Control": "no-store" } });
    const intake=tripIntake(safeMessages);
    if(intake)return Response.json(intake,{headers:{"Cache-Control":"no-store"}});
    if (!await withinWebsiteScope(safeMessages, request.signal)) return Response.json(SCOPE_REFUSAL, { headers: { "Cache-Control": "no-store" } });
    stage="answer";
    return Response.json(await answerChat(safeMessages, request.signal), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("Chat request failed",{stage,kind:error instanceof Error?error.name:"unknown",status:error instanceof AIError?error.status:502});
    return Response.json({ error: error instanceof AIError ? error.message : "Kết nối AI bị gián đoạn. Bạn thử lại nhé." }, { status: error instanceof AIError ? error.status : 502 });
  } finally { inFlight--; }
}
