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
import { removeImageBackground } from "@/lib/tickets/removeImageBackground";
import {
  DEFAULT_TICKET_IMAGE_SCALE,
  DEFAULT_TICKET_TEXT_TRANSFORM,
  DEFAULT_TICKET_TITLE_TRANSFORM,
  STICKER_CHOICES,
  THEME_PRESETS,
  type TicketDesign,
  type TicketLayout,
  type TicketSticker,
  type TicketTextTransform,
  type TicketTitleTransform,
  type TicketTheme,
} from "@/lib/tickets/types";

const inputClass =
  "w-full rounded-md border border-[#e4e4e7] bg-[#ffffff] px-3.5 py-2.5 text-sm text-[#18181b] outline-none transition placeholder:text-[#a1a1aa] focus:border-[#52525b] focus:ring-2 focus:ring-[#52525b]/15";

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

async function compressImage(
  file: Blob,
  preserveTransparency = false,
): Promise<string> {
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

  if (!preserveTransparency) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL(
    preserveTransparency ? "image/png" : "image/jpeg",
    0.88,
  );
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
      <label className="block text-sm font-medium text-[#27272a]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[#a1a1aa]">{hint}</p> : null}
    </div>
  );
}

export default function TicketEditor({ ticket }: { ticket?: TicketDesign }) {
  const router = useRouter();

  const [ticketId, setTicketId] = useState<string | null>(ticket?.id ?? null);
  const [ticketCode, setTicketCode] = useState(ticket?.code);
  const [savedAt, setSavedAt] = useState(ticket?.updatedAt);
  const [title, setTitle] = useState(ticket?.title ?? "Vé du lịch Đồng Tháp");
  const [from, setFrom] = useState(ticket?.from ?? "Đồng Tháp");
  const [to, setTo] = useState(ticket?.to ?? "Người bạn");
  const [message, setMessage] = useState(
    ticket?.message ??
      "Chúc bạn một chuyến đi thật đẹp\nvà nhiều kỷ niệm đáng nhớ.",
  );
  const [titleTransform, setTitleTransform] = useState<TicketTitleTransform>(
    ticket?.titleTransform ?? DEFAULT_TICKET_TITLE_TRANSFORM,
  );
  const [textTransform, setTextTransform] = useState<TicketTextTransform>(
    ticket?.textTransform
      ? { ...DEFAULT_TICKET_TEXT_TRANSFORM, ...ticket.textTransform }
      : DEFAULT_TICKET_TEXT_TRANSFORM,
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
      scale: ticket?.image.scale ?? DEFAULT_TICKET_IMAGE_SCALE,
    x: ticket?.image.x ?? 0,
    y: ticket?.image.y ?? 0,
  });
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const [mobileView,setMobileView] = useState<"controls"|"preview">("controls");
  const [uploading, setUploading] = useState(false);
  const [removingBackground, setRemovingBackground] = useState(false);
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
    frameWidth: number;
    frameHeight: number;
  } | null>(null);
  const titleDragRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    previewWidth: number;
  } | null>(null);
  const textDragRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    previewWidth: number;
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
    code: ticketCode,
    title,
    from,
    to,
    message,
    titleTransform,
    textTransform,
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
      frameWidth: event.currentTarget.getBoundingClientRect().width,
      frameHeight: event.currentTarget.getBoundingClientRect().height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTitlePointerDown(event: ReactPointerEvent<HTMLHeadingElement>) {
    const preview = previewRef.current;
    if (!preview) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedStickerId(null);

    titleDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: titleTransform.x,
      startY: titleTransform.y,
      previewWidth: preview.getBoundingClientRect().width,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleTextPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const preview = previewRef.current;
    if (!preview) return;

    event.preventDefault();
    event.stopPropagation();
    setSelectedStickerId(null);

    textDragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: textTransform.x,
      startY: textTransform.y,
      previewWidth: preview.getBoundingClientRect().width,
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
      const deltaX =
        ((event.clientX - imageDrag.pointerX) / imageDrag.frameWidth) * 100;
      const deltaY =
        ((event.clientY - imageDrag.pointerY) / imageDrag.frameHeight) * 100;

      setImageTransform((prev) => ({
        ...prev,
        x: clamp(imageDrag.startX + deltaX, -250, 250),
        y: clamp(imageDrag.startY + deltaY, -250, 250),
      }));
      return;
    }

    const titleDrag = titleDragRef.current;
    if (titleDrag) {
      const deltaX =
        ((event.clientX - titleDrag.pointerX) / titleDrag.previewWidth) * 100;
      const deltaY =
        ((event.clientY - titleDrag.pointerY) / titleDrag.previewWidth) * 100;

      setTitleTransform((prev) => ({
        ...prev,
        x: clamp(titleDrag.startX + deltaX, -24, 24),
        y: clamp(titleDrag.startY + deltaY, -10, 10),
      }));
      return;
    }

    const textDrag = textDragRef.current;
    if (textDrag) {
      const deltaX =
        ((event.clientX - textDrag.pointerX) / textDrag.previewWidth) * 100;
      const deltaY =
        ((event.clientY - textDrag.pointerY) / textDrag.previewWidth) * 100;

      setTextTransform((prev) => ({
        ...prev,
        x: clamp(textDrag.startX + deltaX, -24, 24),
        y: clamp(textDrag.startY + deltaY, -10, 10),
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
    titleDragRef.current = null;
    textDragRef.current = null;
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
      setImageTransform({ scale: DEFAULT_TICKET_IMAGE_SCALE, x: 0, y: 0 });
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
    setImageTransform({ scale: DEFAULT_TICKET_IMAGE_SCALE, x: 0, y: 0 });
  }

  async function handleRemoveBackground() {
    if (!imageUrl) return;

    setRemovingBackground(true);
    setStatus(null);

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Image could not be loaded");

      const source = await response.blob();
      const cutout = await removeImageBackground(source);
      const dataUrl = await compressImage(cutout, true);

      setPendingImage(dataUrl);
      setImageUrl(dataUrl);
      setImageRemoved(false);
    } catch {
      setStatus({
        kind: "error",
        text: "ChÆ°a thá»ƒ xÃ³a phÃ´ng áº£nh. HÃ£y thá»­ láº¡i vá»›i áº£nh chÃ¢n dung rÃµ nÃ©t.",
      });
    } finally {
      setRemovingBackground(false);
    }
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
      expectedUpdatedAt: savedAt,
      title,
      from,
      to,
      message,
      titleTransform,
      textTransform,
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
      setTicketCode(saved.code);
      setSavedAt(saved.updatedAt);
      setImageUrl(saved.image.url);
      setPendingImage(null);
      setImageRemoved(false);
      setImageTransform({
        scale: saved.image.scale,
        x: saved.image.x,
        y: saved.image.y,
      });
      setTitleTransform(
        saved.titleTransform ?? DEFAULT_TICKET_TITLE_TRANSFORM,
      );
      setTextTransform(
        saved.textTransform
          ? { ...DEFAULT_TICKET_TEXT_TRANSFORM, ...saved.textTransform }
          : DEFAULT_TICKET_TEXT_TRANSFORM,
      );
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
    <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border border-[#e4e4e7] bg-white p-2.5 text-[#71717a] shadow-sm transition hover:bg-[#f4f4f5] hover:text-[#18181b]"
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#52525b]">
              {ticketCode ?? "Tạo vé của tôi"}
            </p>
            <h1 className="mt-0.5 font-sans text-2xl tracking-tight text-[#18181b] md:text-3xl">
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
            disabled={saving || uploading || removingBackground || ticket?.printLocked}
            className="rounded-md bg-[#18181b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#52525b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu thiết kế"}
          </button>
        </div>
      </div>

      {ticket?.printLocked && <p role="status" className="rounded-md border border-black/15 bg-white/70 p-4 text-sm">Vé đang in, đã in hoặc đã trao. Bạn vẫn có thể xem vé; thiết kế hiện được khóa để khớp bản in.</p>}
      <div className="flex shrink-0 gap-1 rounded-md bg-zinc-100 p-1 lg:hidden" role="group" aria-label="Chế độ thiết kế vé">{([["controls","Chỉnh sửa"],["preview","Xem trước & kéo ảnh"]] as const).map(([value,label])=><button type="button" key={value} aria-pressed={mobileView===value} onClick={()=>setMobileView(value)} className={`flex-1 rounded px-3 py-1.5 text-xs ${mobileView===value?"bg-white font-medium shadow-sm":"text-zinc-500"}`}>{label}</button>)}</div>
      <div className={`grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] ${ticket?.printLocked ? "pointer-events-none opacity-70" : ""}`}>
        <div className={`min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white ${mobileView==="controls"?"flex":"hidden lg:flex"}`}>
          <div className="flex shrink-0 overflow-x-auto border-b border-zinc-200 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`whitespace-nowrap px-4 py-3 text-xs font-semibold transition ${
                  tab === item.id
                    ? "border-b-2 border-[#52525b] text-[#52525b]"
                    : "text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
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

                <Field
                  label={`Cỡ tiêu đề: ${titleTransform.scale.toFixed(2)}×`}
                  hint="Kéo dòng tiêu đề trực tiếp trong bản xem trước để đặt lại vị trí."
                >
                  <input
                    type="range"
                    min="0.55"
                    max="1.5"
                    step="0.05"
                    value={titleTransform.scale}
                    onChange={(event) =>
                      setTitleTransform((prev) => ({
                        ...prev,
                        scale: Number(event.target.value),
                      }))
                    }
                    className="w-full accent-[#52525b]"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tiêu đề ngang">
                    <input
                      type="range"
                      min="-24"
                      max="24"
                      value={titleTransform.x}
                      onChange={(event) =>
                        setTitleTransform((prev) => ({
                          ...prev,
                          x: Number(event.target.value),
                        }))
                      }
                      className="w-full accent-[#52525b]"
                    />
                  </Field>
                  <Field label="Tiêu đề dọc">
                    <input
                      type="range"
                      min="-10"
                      max="10"
                      value={titleTransform.y}
                      onChange={(event) =>
                        setTitleTransform((prev) => ({
                          ...prev,
                          y: Number(event.target.value),
                        }))
                      }
                      className="w-full accent-[#52525b]"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTitleTransform(DEFAULT_TICKET_TITLE_TRANSFORM)
                  }
                  className="w-full rounded-lg border border-[#e4e4e7] py-2 text-sm font-medium text-[#27272a] transition hover:bg-[#f4f4f5]"
                >
                  Căn giữa và đặt lại cỡ tiêu đề
                </button>

                <Field
                  label={`Cỡ cụm chữ: ${textTransform.scale.toFixed(2)}×`}
                  hint="Kéo phần chữ để di chuyển cả cụm trên mặt vé."
                >
                  <input
                    type="range"
                    min="0.55"
                    max="1.2"
                    step="0.05"
                    value={textTransform.scale}
                    onChange={(event) =>
                      setTextTransform((prev) => ({
                        ...prev,
                        scale: Number(event.target.value),
                      }))
                    }
                    className="w-full accent-[#52525b]"
                  />
                </Field>

                <button
                  type="button"
                  onClick={() =>
                    setTextTransform(DEFAULT_TICKET_TEXT_TRANSFORM)
                  }
                  className="w-full rounded-lg border border-[#e4e4e7] py-2 text-sm font-medium text-[#27272a] transition hover:bg-[#f4f4f5]"
                >
                  Đặt lại kích thước và vị trí cụm chữ
                </button>

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
                  disabled={uploading || removingBackground}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[#e4e4e7] bg-[#f4f4f5] px-4 py-8 text-center transition hover:border-emerald-500 hover:bg-zinc-100 disabled:opacity-50"
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
                    className="text-[#52525b]"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span className="text-sm font-semibold text-[#27272a]">
                    {uploading
                      ? "Đang xử lý ảnh..."
                      : imageUrl
                        ? "Đổi ảnh khác"
                        : "Tải ảnh lên"}
                  </span>
                  <span className="text-xs text-[#a1a1aa]">
                    JPG hoặc PNG · tự động nén và cắt theo khung vé
                  </span>
                </button>

                {imageUrl ? (
                  <div className="space-y-5">
                    <div className="rounded-md border border-forest/10 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#18181b]">
                            Tách chủ thể khỏi nền
                          </p>
                          <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#18181b]/60">
                            Xử lý ngay trên thiết bị để tách người hoặc vật thể. Lần đầu cần tải model.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveBackground}
                          disabled={removingBackground || uploading || saving}
                          className="rounded-full bg-[#efc666] px-4 py-2 text-xs font-bold text-[#18181b] transition hover:bg-[#f4d88b] disabled:cursor-wait disabled:opacity-60"
                        >
                          {removingBackground ? "Đang tách nền…" : "Xóa phông"}
                        </button>
                      </div>
                    </div>

                    <Field
                      label={`Phóng to: ${imageTransform.scale.toFixed(2)}×`}
                      hint="Kéo ảnh trực tiếp trên phần xem trước để căn vị trí."
                    >
                      <input
                        type="range"
                        min="0.2"
                        max="2.5"
                        step="0.05"
                        value={imageTransform.scale}
                        onChange={(event) =>
                          setImageTransform((prev) => ({
                            ...prev,
                            scale: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-[#52525b]"
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Vị trí ngang">
                        <input
                          type="range"
                          min="-250"
                          max="250"
                          value={imageTransform.x}
                          onChange={(event) =>
                            setImageTransform((prev) => ({
                              ...prev,
                              x: Number(event.target.value),
                            }))
                          }
                          className="w-full accent-[#52525b]"
                        />
                      </Field>
                      <Field label="Vị trí dọc">
                        <input
                          type="range"
                          min="-250"
                          max="250"
                          value={imageTransform.y}
                          onChange={(event) =>
                            setImageTransform((prev) => ({
                              ...prev,
                              y: Number(event.target.value),
                            }))
                          }
                          className="w-full accent-[#52525b]"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setImageTransform((prev) => ({
                            ...prev,
                            scale: DEFAULT_TICKET_IMAGE_SCALE,
                            x: 0,
                            y: 0,
                          }))
                        }
                        className="rounded-lg border border-[#e4e4e7] py-2 text-sm font-medium text-[#27272a] transition hover:bg-[#f4f4f5]"
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
                  <p className="text-xs leading-relaxed text-[#a1a1aa]">
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
                        className="rounded-lg border border-[#e4e4e7] bg-white py-2 text-xl transition hover:border-[#52525b] hover:bg-zinc-100"
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
                              ? "border-[#52525b] bg-[#f4f4f5]"
                              : "border-[#e4e4e7] hover:bg-[#f4f4f5]"
                          }`}
                        >
                          <span className="text-base">{sticker.emoji}</span>
                          <span className="text-xs text-[#a1a1aa]">
                            {index + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : (
                  <p className="text-xs text-[#a1a1aa]">
                    Chưa có sticker nào trên vé.
                  </p>
                )}

                {selectedSticker ? (
                  <div className="space-y-4 rounded-md bg-[#f4f4f5] p-4">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#27272a]">
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
                        className="w-full accent-[#52525b]"
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
                        className="w-full accent-[#52525b]"
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
                        className={`w-full rounded-md border p-3 text-left transition ${
                          layout === option.id
                            ? "border-[#52525b] bg-[#f4f4f5]"
                            : "border-[#e4e4e7] hover:bg-[#f4f4f5]"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-[#18181b]">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#71717a]">
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
                        className={`rounded-md border p-3 text-left transition ${
                          theme.background === preset.theme.background &&
                          theme.accent === preset.theme.accent
                            ? "border-[#52525b] bg-[#f4f4f5]"
                            : "border-[#e4e4e7] hover:bg-[#f4f4f5]"
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
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e4e7] px-3 py-2"
                      >
                        <span className="text-sm text-[#4b5d52]">
                          {item.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs uppercase text-[#a1a1aa]">
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
                            className="h-8 w-10 cursor-pointer rounded border border-[#e4e4e7] bg-white p-0.5"
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

        <div className={`min-h-0 flex-col ${mobileView==="preview"?"flex":"hidden lg:flex"}`}>
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white p-4">
            <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-sans text-xl text-[#18181b]">
                  Xem trước & chỉnh trực tiếp
                </h2>
                <p className="text-xs text-[#71717a]">
                  Kéo ảnh để căn khung; kéo tiêu đề riêng, hoặc kéo phần chữ khác để di chuyển cả cụm. Sticker cũng kéo được.
                </p>
              </div>
              <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#71717a]">
                {LAYOUT_LABELS[layout]}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center [container-type:size]">
              <TicketPreview
                design={previewDesign}
                rootRef={previewRef}
                className="aspect-[103/58] w-[min(100cqw,calc(95cqh*103/58))] rounded-md ring-1 ring-black/5"
                selectedStickerId={selectedStickerId}
                onBackgroundClick={() => setSelectedStickerId(null)}
                onStickerPointerDown={handleStickerPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onImagePointerDown={handleImagePointerDown}
                onTitlePointerDown={handleTitlePointerDown}
                onTextPointerDown={handleTextPointerDown}
              />
            </div>

            <div className="mt-3 grid shrink-0 grid-cols-4 gap-2 text-[10px]">
              <div className="rounded-lg bg-[#f4f4f5] px-3 py-2">
                <p className="text-[#a1a1aa]">Ảnh</p>
                <p className="font-semibold text-[#27272a]">
                  {imageUrl ? "Đã thêm" : "Chưa có"}
                </p>
              </div>
              <div className="rounded-lg bg-[#f4f4f5] px-3 py-2">
                <p className="text-[#a1a1aa]">Sticker</p>
                <p className="font-semibold text-[#27272a]">{stickers.length}</p>
              </div>
              <div className="rounded-lg bg-[#f4f4f5] px-3 py-2">
                <p className="text-[#a1a1aa]">Bố cục</p>
                <p className="font-semibold text-[#27272a]">
                  {LAYOUT_LABELS[layout]}
                </p>
              </div>
              <div className="rounded-lg bg-[#f4f4f5] px-3 py-2">
                <p className="text-[#a1a1aa]">Trạng thái</p>
                <p className="font-semibold text-[#27272a]">
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
