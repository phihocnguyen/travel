import "server-only";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export class AIError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Shared server client for AI features. Credentials never enter client bundles.
export async function completeAI(messages: AIMessage[], signal?: AbortSignal): Promise<string> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new AIError(503, "Xoài chưa được cấu hình kết nối AI.");
  const base = (process.env.AI_BASE_URL || "https://platform.beeknoee.com/v1").replace(/\/+$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST", cache: "no-store", redirect: "error",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.AI_MODEL || "glm-4.5-flash", messages, max_tokens: 3000, stream: false }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60_000)]) : AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    // Do not expose upstream bodies, which may contain account or key details.
    throw new AIError(response.status === 429 ? 429 : 502, response.status === 429 ? "Xoài đang nhận nhiều câu hỏi. Bạn thử lại sau một chút nhé." : "Xoài chưa kết nối được dịch vụ AI. Bạn thử lại sau nhé.");
  }
  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new AIError(502, "Xoài chưa nhận được câu trả lời. Bạn thử lại nhé.");
  return content.trim();
}
