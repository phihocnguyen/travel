"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import TicketPreview from "./TicketPreview";
import {
  STICKER_CHOICES,
  THEME_PRESETS,
  type TicketDesign,
  type TicketLayout,
  type TicketSticker,
  type TicketTheme,
} from "@/lib/tickets/types";

const inputClass =
  "w-full rounded-xl border border-[#d9cdb4] bg-[#fffdf7] px-3.5 py-2.5 text-sm text-[#14281e] outline-none transition placeholder:text-[#9a8f7a] focus:border-[#2f7d4f] focus:ring-2 focus:ring-[#2f7d4f]/15";

const TABS = [
  { id: "content", label: "Nội dung" },
  { id: "image", label: "Ảnh" },
  { id: "decorate", label: "Sticker" },
  { id: "style", label: "Màu & bố cục" },
] as const;

type Tab = (typeof TABS)[number]["id"];

const LAYOUT_OPTIONS: {
  id: TicketLayout;
  label: string;
  description: string;
}[] = [
  {
    id: "left",
    label: "Ảnh bên trái",
    description: "Ảnh kỷ niệm đặt trái, lời nhắn đặt phải trong khung vé.",
  },
  {
    id: "right",
    label: "Ảnh bên phải",
    description: "Lời nhắn bên trái, ảnh kỷ niệm bên phải.",
  },
  {
    id: "full",
    label: "Toàn khung",
    description: "Ảnh phủ kín khung, lời nhắn nổi phía dưới.",
  },
];

const LAYOUT_LABELS: Record<TicketLayout, string> = {
  left: "Ảnh trái",
  right: "Ảnh phải",
  full: "Toàn khung",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1600;
  const ratio = Math.min(
    1,
    maxSize / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas không được hỗ trợ");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.88);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#3c5145]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[#9a8f7a]">{hint}</p> : null}
    </div>
  );
}

export default function TicketEditor({ ticket }: { ticket?: TicketDesign }) {
  const router = useRouter();

  const [ticketId, setTicketId] = useState<string | null>(ticket?.id ?? null);
  const [title, setTitle] = useState(ticket?.title ?? "Vé du lịch Đồng Tháp");
  const [from, setFrom] = useState(ticket?.from ?? "Đồng Tháp");
  const [to, setTo] = useState(ticket?.to ?? "Người bạn");
  const [message, setMessage] = useState(
    ticket?.message ??
      "Chúc bạn một chuyến đi thật đẹp\nvà nhiều kỷ niệm đáng nhớ.",
  );
  const [layout, setLayout] = useState<TicketLayout>(
    ticket?.layout ?? "left",
  );
  const [theme, setTheme] = useState<TicketTheme>(
    ticket?.theme ?? THEME_PRESETS[0].theme,
  );
  const [stickers, setStickers] = useState<TicketSticker[]>(
    ticket?.stickers ?? [],
  );
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    ticket?.image.url ?? null,
  );
  const [imageTransform, setImageTransform] = useState({
    scale: ticket?.image.scale ?? 1,
    x: ticket?.image.x ?? 0,
    y: ticket?.image.y ?? 0,
  });
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDragRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const stickerDragRef = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const selectedSticker = stickers.find(
    (sticker) => sticker.id === selectedStickerId,
  );

  const previewDesign: TicketDesign = {
    id: ticketId ?? "preview",
    title,
    from,
    to,
    message,
    layout,
    theme,
    stickers,
    image: { url: imageUrl, ...imageTransform },
    createdAt: ticket?.createdAt ?? "",
    updatedAt: ticket?.updatedAt ?? "",
  };

  function handleImagePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageUrl) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedStickerId(null);

    imageDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: imageTransform.x,
      startY: imageTransform.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleStickerPointerDown(
    event: ReactPointerEvent<HTMLSpanElement>,
    stickerId: string,
  ) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedStickerId(stickerId);

    stickerDragRef.current = {
      id: stickerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: sticker.x,
      startY: sticker.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const preview = previewRef.current;
    if (!preview) return;

    const rect = preview.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const imageDrag = imageDragRef.current;

    if (imageDrag) {
      const deltaX = ((event.clientX - imageDrag.pointerX) / rect.width) * 100;
      const deltaY = ((event.clientY - imageDrag.pointerY) / rect.height) * 100;

      setImageTransform((prev) => ({
        ...prev,
        x: clamp(imageDrag.startX + deltaX, -100, 100),
        y: clamp(imageDrag.startY + deltaY, -100, 100),
      }));
      return;
    }

    const stickerDrag = stickerDragRef.current;

    if (stickerDrag) {
      const deltaX = ((event.clientX - stickerDrag.pointerX) / rect.width) * 100;
      const deltaY =
        ((event.clientY - stickerDrag.pointerY) / rect.height) * 100;

      setStickers((prev) =>
        prev.map((sticker) =>
          sticker.id === stickerDrag.id
            ? {
                ...sticker,
                x: clamp(stickerDrag.startX + deltaX, 0, 100),
                y: clamp(stickerDrag.startY + deltaY, 0, 100),
              }
            : sticker,
        ),
      );
    }
  }

  function handlePointerUp() {
    imageDragRef.current = null;
    stickerDragRef.current = null;
  }

  function addSticker(emoji: string) {
    const offset = (stickers.length % 5) * 7 - 14;
    const sticker: TicketSticker = {
      id: crypto.randomUUID(),
      emoji,
      x: clamp(50 + offset, 10, 90),
      y: clamp(50 + offset * 0.5, 10, 90),
      size: 10,
      rotation: 0,
    };

    setStickers((prev) => [...prev, sticker]);
    setSelectedStickerId(sticker.id);
    setTab("decorate");
  }

  function updateSelectedSticker(patch: Partial<TicketSticker>) {
    if (!selectedStickerId) return;

    setStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === selectedStickerId ? { ...sticker, ...patch } : sticker,
      ),
    );
  }

  function removeSelectedSticker() {
    if (!selectedStickerId) return;

    setStickers((prev) =>
      prev.filter((sticker) => sticker.id !== selectedStickerId),
    );
    setSelectedStickerId(null);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus({ kind: "error", text: "Vui lòng chọn một file ảnh." });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const dataUrl = await compressImage(file);
      setPendingImage(dataUrl);
      setImageUrl(dataUrl);
      setImageRemoved(false);
      setImageTransform({ scale: 1, x: 0, y: 0 });
      setTab("image");
    } catch {
      setStatus({
        kind: "error",
        text: "Không thể đọc ảnh này. Hãy thử JPG hoặc PNG.",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage() {
    setImageUrl(null);
    setPendingImage(null);
    setImageRemoved(true);
    setImageTransform({ scale: 1, x: 0, y: 0 });
  }

  async function handleSave() {
    if (!title.trim()) {
      setStatus({ kind: "error", text: "Nhập tiêu đề vé trước khi lưu." });
      setTab("content");
      return;
    }

    setSaving(true);
    setStatus(null);

    const payload = {
      title,
      from,
      to,
      message,
      layout,
      theme,
      stickers,
      image: imageTransform,
      ...(pendingImage ? { imageDataUrl: pendingImage } : {}),
      ...(imageRemoved ? { removeImage: true } : {}),
    };

    try {
      const response = await fetch(
        ticketId ? `/api/tickets/${ticketId}` : "/api/tickets",
        {
          method: ticketId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { ticket?: TicketDesign; error?: string }
        | null;

      if (!response.ok || !data?.ticket) {
        setStatus({
          kind: "error",
          text: data?.error ?? "Không thể lưu thiết kế. Vui lòng thử lại.",
        });
        return;
      }

      const saved = data.ticket;

      setTicketId(saved.id);
      setImageUrl(saved.image.url);
      setPendingImage(null);
      setImageRemoved(false);
      setImageTransform({
        scale: saved.image.scale,
        x: saved.image.x,
        y: saved.image.y,
      });
      setStatus({ kind: "success", text: "Đã lưu thiết kế." });

      if (ticketId) {
        router.refresh();
      } else {
        router.replace(`/dashboard/tickets/${saved.id}`);
      }
    } catch {
      setStatus({
        kind: "error",
        text: "Không thể kết nối máy chủ. Vui lòng thử lại.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border border-[#e2d8c3] bg-white p-2.5 text-[#6b7a6f] shadow-sm transition hover:bg-[#f7f1e4] hover:text-[#14281e]"
            aria-label="Quay lại thư viện"
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a4651c]">
              {ticketId ? "Chỉnh sửa" : "Tạo mới"}
            </p>
            <h1 className="mt-0.5 font-display text-2xl tracking-tight text-[#14281e] md:text-3xl">
              {ticketId ? "Chỉnh sửa vé du lịch" : "Thiết kế vé du lịch"}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {status ? (
            <span
              role="status"
              className={`rounded-lg px-3 py-2 text-sm ${
                status.kind === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {status.text}
            </span>
          ) : null}

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="rounded-xl bg-[#14281e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3a2a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu thiết kế"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="self-start overflow-hidden rounded-2xl border border-[#e2d8c3] bg-white shadow-sm xl:sticky xl:top-24">
          <div className="flex overflow-x-auto border-b border-[#e2d8c3]">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap px-4 py-3 text-xs font-semibold transition ${
                  tab === item.id
                    ? "border-b-2 border-[#a4651c] text-[#a4651c]"
                    : "text-[#6b7a6f] hover:bg-[#f7f1e4] hover:text-[#14281e]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-h-[calc(100dvh-12rem)] space-y-5 overflow-y-auto p-5">
            {tab === "content" ? (
              <>
                <Field label="Tiêu đề vé">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={90}
                    className={inputClass}
                    placeholder="Vé du lịch Đồng Tháp"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Từ">
                    <input
                      value={from}
                      onChange={(event) => setFrom(event.target.value)}
                      maxLength={40}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Đến">
                    <input
                      value={to}
                      onChange={(event) => setTo(event.target.value)}
                      maxLength={40}
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field
                  label="Lời nhắn"
                  hint={`${message.length}/800 ký tự`}
                >
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value.slice(0, 800))
                    }
                    rows={7}
                    className={`${inputClass} resize-y`}
                    placeholder="Viết lời nhắn cho chuyến đi..."
                  />
                </Field>
              </>
            ) : null}

            {tab === "image" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#d9cdb4] bg-[#f7f1e4] px-4 py-8 text-center transition hover:border-emerald-500 hover:bg-[#fdf3da] disabled:opacity-50"
                >
                  <svg
                    width={26}
                    height={26}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#2f7d4f]"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="text-sm font-semibold text-[#3c5145]">
                    {uploading
                      ? "Đang xử lý ảnh..."
                      : imageUrl
                        ? "Đổi ảnh khác"
                        : "Tải ảnh lên"}
                  </span>
                  <span className="text-xs text-[#9a8f7a]">
                    JPG hoặc PNG · tự động nén và cắt theo khung vé
                  </span>
                </button>

                {imageUrl ? (
                  <div className="space-y-5">
                    <Field
                      label={`Phóng to: ${imageTransform.scale.toFixed(2)}×`}
                      hint="Kéo ảnh trực tiếp trên phần xem trước để căn vị trí."
                    >
                      <input
                        type="range"
                        min="1"
                        max="4"
                        step="0.05"
                        value={imageTransform.scale}
                        onChange={(event) =>
                          setImageTransform((prev) => ({
                            ...prev,
                            scale: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-[#2f7d4f]"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Vị trí ngang">
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={imageTransform.x}
                          onChange={(event) =>
                            setImageTransform((prev) => ({
                              ...prev,
                              x: Number(event.target.value),
                            }))
                          }
                          className="w-full accent-[#2f7d4f]"
                        />
                      </Field>
                      <Field label="Vị trí dọc">
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={imageTransform.y}
                          onChange={(event) =>
                            setImageTransform((prev) => ({
                              ...prev,
                              y: Number(event.target.value),
                            }))
                          }
                          className="w-full accent-[#2f7d4f]"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setImageTransform((prev) => ({
                            ...prev,
                            scale: 1,
                            x: 0,
                            y: 0,
                          }))
                        }
                        className="rounded-lg border border-[#d9cdb4] py-2 text-sm font-medium text-[#3c5145] transition hover:bg-[#f7f1e4]"
                      >
                        Vừa khung
                      </button>
                      <button
                        onClick={handleRemoveImage}
                        className="rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Xoá ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs leading-relaxed text-[#9a8f7a]">
                    Chưa có ảnh. Vé sẽ dùng nền màu chủ đề cho đến khi bạn tải
                    ảnh lên.
                  </p>
                )}
              </>
            ) : null}

            {tab === "decorate" ? (
              <>
                <Field
                  label="Thêm sticker"
                  hint="Nhấn để thêm vào vé, sau đó kéo trên phần xem trước."
                >
                  <div className="grid grid-cols-6 gap-2">
                    {STICKER_CHOICES.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => addSticker(emoji)}
                        className="rounded-lg border border-[#e2d8c3] bg-white py-2 text-xl transition hover:border-[#a4651c] hover:bg-[#fdf3da]"
                        aria-label={`Thêm sticker ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </Field>

                {stickers.length > 0 ? (
                  <Field label={`Sticker trên vé (${stickers.length})`}>
                    <div className="flex flex-wrap gap-2">
                      {stickers.map((sticker, index) => (
                        <button
                          key={sticker.id}
                          onClick={() => setSelectedStickerId(sticker.id)}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                            selectedStickerId === sticker.id
                              ? "border-[#a4651c] bg-[#fdf3da]"
                              : "border-[#e2d8c3] hover:bg-[#f7f1e4]"
                          }`}
                        >
                          <span className="text-base">{sticker.emoji}</span>
                          <span className="text-xs text-[#9a8f7a]">
                            {index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : (
                  <p className="text-xs text-[#9a8f7a]">
                    Chưa có sticker nào trên vé.
                  </p>
                )}

                {selectedSticker ? (
                  <div className="space-y-4 rounded-xl bg-[#f7f1e4] p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#3c5145]">
                        <span className="text-xl">
                          {selectedSticker.emoji}
                        </span>
                        Sticker đang chọn
                      </p>
                      <button
                        onClick={removeSelectedSticker}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Xoá
                      </button>
                    </div>

                    <Field
                      label={`Kích thước: ${selectedSticker.size.toFixed(0)}`}
                    >
                      <input
                        type="range"
                        min="4"
                        max="30"
                        value={selectedSticker.size}
                        onChange={(event) =>
                          updateSelectedSticker({
                            size: Number(event.target.value),
                          })
                        }
                        className="w-full accent-[#2f7d4f]"
                      />
                    </Field>

                    <Field
                      label={`Góc xoay: ${selectedSticker.rotation.toFixed(0)}°`}
                    >
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedSticker.rotation}
                        onChange={(event) =>
                          updateSelectedSticker({
                            rotation: Number(event.target.value),
                          })
                        }
                        className="w-full accent-[#2f7d4f]"
                      />
                    </Field>
                  </div>
                ) : null}
              </>
            ) : null}

            {tab === "style" ? (
              <>
                <Field label="Bố cục">
                  <div className="space-y-2">
                    {LAYOUT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setLayout(option.id)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          layout === option.id
                            ? "border-[#a4651c] bg-[#fdf3da]"
                            : "border-[#e2d8c3] hover:bg-[#f7f1e4]"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-[#14281e]">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#6b7a6f]">
                          {option.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Bảng màu">
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setTheme(preset.theme)}
                        className={`rounded-xl border p-3 text-left transition ${
                          theme.background === preset.theme.background &&
                          theme.accent === preset.theme.accent
                            ? "border-[#a4651c] bg-[#fdf3da]"
                            : "border-[#e2d8c3] hover:bg-[#f7f1e4]"
                        }`}
                      >
                        <span className="flex gap-1">
                          {[
                            preset.theme.background,
                            preset.theme.accent,
                            preset.theme.ink,
                          ].map((color) => (
                            <span
                              key={color}
                              className="h-4 w-4 rounded-full border border-black/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </span>
                        <span className="mt-1.5 block text-xs font-medium text-[#4b5d52]">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Màu tuỳ chỉnh">
                  <div className="space-y-3">
                    {(
                      [
                        { key: "background", label: "Nền vé" },
                        { key: "ink", label: "Chữ" },
                        { key: "accent", label: "Điểm nhấn" },
                      ] as const
                    ).map((item) => (
                      <label
                        key={item.key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#e2d8c3] px-3 py-2"
                      >
                        <span className="text-sm text-[#4b5d52]">
                          {item.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs uppercase text-[#9a8f7a]">
                            {theme[item.key]}
                          </span>
                          <input
                            type="color"
                            value={theme[item.key]}
                            onChange={(event) =>
                              setTheme((prev) => ({
                                ...prev,
                                [item.key]: event.target.value,
                              }))
                            }
                            className="h-8 w-10 cursor-pointer rounded border border-[#e2d8c3] bg-white p-0.5"
                          />
                        </span>
                      </label>
                    ))}
                  </div>
                </Field>
              </>
            ) : null}
          </div>
        </div>

        <div className="self-start">
          <div className="rounded-3xl border border-[#e2d8c3] bg-[#fffdf7] p-4 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl text-[#14281e]">
                  Xem trước & chỉnh trực tiếp
                </h2>
                <p className="text-xs text-[#6b7a6f]">
                  Kéo ảnh để căn khung, kéo sticker để đổi vị trí.
                </p>
              </div>
              <span className="rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#6b7a6f]">
                {LAYOUT_LABELS[layout]}
              </span>
            </div>

            <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
              <TicketPreview
                design={previewDesign}
                rootRef={previewRef}
                className="aspect-[103/58] w-full"
                selectedStickerId={selectedStickerId}
                onBackgroundClick={() => setSelectedStickerId(null)}
                onStickerPointerDown={handleStickerPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onImagePointerDown={handleImagePointerDown}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-[#f7f1e4] px-3 py-2">
                <p className="text-[#9a8f7a]">Ảnh</p>
                <p className="font-semibold text-[#3c5145]">
                  {imageUrl ? "Đã thêm" : "Chưa có"}
                </p>
              </div>
              <div className="rounded-lg bg-[#f7f1e4] px-3 py-2">
                <p className="text-[#9a8f7a]">Sticker</p>
                <p className="font-semibold text-[#3c5145]">{stickers.length}</p>
              </div>
              <div className="rounded-lg bg-[#f7f1e4] px-3 py-2">
                <p className="text-[#9a8f7a]">Bố cục</p>
                <p className="font-semibold text-[#3c5145]">
                  {LAYOUT_LABELS[layout]}
                </p>
              </div>
              <div className="rounded-lg bg-[#f7f1e4] px-3 py-2">
                <p className="text-[#9a8f7a]">Trạng thái</p>
                <p className="font-semibold text-[#3c5145]">
                  {ticketId ? "Đã lưu" : "Chưa lưu"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
