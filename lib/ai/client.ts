import "server-only";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export class AIError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Shared server client for AI features. Credentials never enter client bundles.
export async function completeAI(messages: AIMessage[], signal?: AbortSignal, options: { maxTokens?: number } = {}): Promise<string> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new AIError(503, "Xoài chưa được cấu hình kết nối AI.");
  const base = (process.env.AI_BASE_URL || "https://platform.beeknoee.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL || "glm-4.5-flash";
  const deadline = signal ? AbortSignal.any([signal, AbortSignal.timeout(90_000)]) : AbortSignal.timeout(90_000);
  let maxTokens = options.maxTokens ?? 3000;
  for (let attempt = 0; attempt < 2; attempt++) {
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST", cache: "no-store", redirect: "error",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: false, ...(model.startsWith("glm-") ? { thinking: { type: "disabled" } } : {}) }),
    signal: deadline,
  });
  if (!response.ok) {
    // Only log known error codes, never upstream messages or response bodies:
    // providers may include account or key details in them.
    const failure = await response.json().catch(() => null);
    const knownCodes = ["concurrent_limit_exceeded", "rate_limit_exceeded", "insufficient_quota", "invalid_api_key", "model_not_found"];
    const code = knownCodes.includes(failure?.error?.code) ? failure.error.code : "unknown";
    console.warn("AI upstream request failed", { status: response.status, code, model });
    if (response.status === 429 && code === "concurrent_limit_exceeded") {
      throw new AIError(429, "Dịch vụ AI đang đạt giới hạn xử lý đồng thời. Bạn chờ yêu cầu trước hoàn tất rồi thử lại nhé.");
    }
    throw new AIError(response.status === 429 ? 429 : 502, response.status === 429 ? "Xoài đang nhận nhiều câu hỏi. Bạn thử lại sau một chút nhé." : "Xoài chưa kết nối được dịch vụ AI. Bạn thử lại sau nhé.");
  }
  const result = await response.json();
  const choice = result?.choices?.[0];
  const content = choice?.message?.content;
  if (choice?.finish_reason === "length") {
    // Retry once with room for a complete verdict/JSON answer. Never expose
    // reasoning_content or return truncated JSON as the assistant's answer.
    if (attempt === 0) { maxTokens = Math.min(8192, Math.max(2048, maxTokens * 2)); continue; }
    console.warn("AI completion truncated", { model, maxTokens });
    throw new AIError(502, "Phản hồi AI bị ngắt trước khi hoàn tất. Bạn thử hỏi ngắn hơn nhé.");
  }
  if (typeof content !== "string" || !content.trim()) {
    console.warn("AI completion empty", { model, finishReason: choice?.finish_reason ?? "missing" });
    throw new AIError(502, "Dịch vụ AI trả về phản hồi rỗng. Câu hỏi của bạn đã được gửi; vui lòng thử lại nhé.");
  }
  return content.trim();
  }
  throw new AIError(502, "Xoài chưa nhận được phản hồi hoàn chỉnh từ dịch vụ AI.");
}
