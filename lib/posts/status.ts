export const STATUS_MAX_LENGTH = 500;

export function statusInput(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Bạn chưa nhập nội dung status.");
  const content = value.replace(/\r\n/g, "\n").trim();
  if (content.length > STATUS_MAX_LENGTH) throw new Error(`Status tối đa ${STATUS_MAX_LENGTH} ký tự.`);
  return {
    title: content.split("\n")[0].slice(0, 80),
    excerpt: content.slice(0, 160),
    content,
    contentFormat: "plain" as const,
    category: "Kinh nghiệm" as const,
  };
}

/** Decode sanitized plain text for React text nodes; never render this as HTML. */
export function decodeStatusText(text: string) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value: string) => {
    if (!value.startsWith("#")) return entities[value.toLowerCase()] ?? entity;
    const code = value[1].toLowerCase() === "x" ? parseInt(value.slice(2), 16) : Number(value.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}
