"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  POST_CATEGORIES,
  POST_STATUS_LABELS,
  type BlogPost,
  type PostCategory,
} from "@/lib/posts/types";

const inputClass =
  "w-full rounded-xl border border-[#d9cdb4] bg-[#fffdf7] px-3.5 py-2.5 text-sm text-[#21352a] outline-none transition placeholder:text-[#9a8f7a] focus:border-[#2f7d4f] focus:ring-2 focus:ring-[#2f7d4f]/15";

const STATUS_STYLES: Record<BlogPost["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

async function compressCover(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxSize = 1600;
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
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

export default function PostEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postId, setPostId] = useState<string | null>(post?.id ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState<PostCategory>(
    post?.category ?? POST_CATEGORIES[0],
  );
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(
    post?.coverImageUrl ?? null,
  );
  const [pendingCover, setPendingCover] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một file ảnh.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const dataUrl = await compressCover(file);
      setPendingCover(dataUrl);
      setCoverUrl(dataUrl);
      setCoverRemoved(false);
    } catch {
      setError("Không thể đọc ảnh bìa. Hãy thử JPG hoặc PNG.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Nhập tiêu đề bài viết trước khi gửi duyệt.");
      return;
    }

    if (!content.trim()) {
      setError("Nội dung bài viết chưa được nhập.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      category,
      excerpt,
      content,
      ...(pendingCover ? { coverImageDataUrl: pendingCover } : {}),
      ...(coverRemoved ? { removeCover: true } : {}),
    };

    try {
      const response = await fetch(
        postId ? `/api/posts/${postId}` : "/api/posts",
        {
          method: postId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json().catch(() => null)) as
        | { post?: BlogPost; error?: string }
        | null;

      if (!response.ok || !data?.post) {
        setError(data?.error ?? "Không thể lưu bài viết. Vui lòng thử lại.");
        return;
      }

      setPostId(data.post.id);
      router.push("/dashboard/posts");
      router.refresh();
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  const status = post?.status;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/posts"
            className="rounded-xl border border-[#ddd2bd] bg-white p-2.5 text-[#6b7a6f] shadow-sm transition hover:bg-[#f7f1e4]"
            aria-label="Quay lại danh sách bài viết"
          >
            ←
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#a4651c]">
              {postId ? "Chỉnh sửa bài viết" : "Bài viết mới"}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-normal tracking-tight text-[#14281e]">
              {postId ? "Cập nhật câu chuyện" : "Viết câu chuyện chuyến đi"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status ? (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
            >
              {POST_STATUS_LABELS[status]}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
              Sẽ gửi duyệt
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="rounded-xl bg-[#14281e] px-6 py-3 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Đang gửi..." : "Lưu & gửi duyệt"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {status === "rejected" && post?.reviewNote ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Bài viết bị từ chối</p>
          <p className="mt-1">{post.reviewNote}</p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 rounded-3xl border border-[#e2d8c3] bg-white p-5 shadow-sm md:p-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#3c5145]">
              Tiêu đề
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder="Một buổi sáng ở chợ nổi Đồng Tháp..."
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#3c5145]">
                Danh mục
              </label>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PostCategory)
                }
                className={inputClass}
              >
                {POST_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#3c5145]">
                Mô tả ngắn
              </label>
              <input
                value={excerpt}
                onChange={(event) =>
                  setExcerpt(event.target.value.slice(0, 320))
                }
                placeholder="Tóm tắt 1–2 câu cho thẻ blog."
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#3c5145]">
              Nội dung
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              placeholder="Kể lại hành trình, món ăn, con người và những điều bạn thấy..."
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-[#e2d8c3] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#3c5145]">Ảnh bìa</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />

            <div
              className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#e8dfc9] bg-cover bg-center"
              style={
                coverUrl
                  ? { backgroundImage: `url(${coverUrl})` }
                  : {
                      background:
                        "linear-gradient(135deg, #2f7d4f 0%, #14281e 100%)",
                    }
              }
            >
              {!coverUrl ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <span className="font-display text-2xl tracking-[0.2em] text-[#f7f1e4]">
                    ĐỒNG THÁP
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#f7f1e4]/60">
                    Ảnh bìa bài viết
                  </span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-xl border border-[#d9cdb4] py-2 text-sm font-medium text-[#3c5145] transition hover:bg-[#f7f1e4] disabled:opacity-50"
              >
                {uploading ? "Đang xử lý..." : coverUrl ? "Đổi ảnh" : "Tải ảnh"}
              </button>
              <button
                onClick={() => {
                  setCoverUrl(null);
                  setPendingCover(null);
                  setCoverRemoved(true);
                }}
                disabled={!coverUrl}
                className="rounded-xl border border-red-200 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
              >
                Xoá ảnh
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e2d8c3] bg-[#fffdf7] p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#3c5145]">
              Xem trước thẻ blog
            </h2>

            <article className="mt-3 overflow-hidden rounded-2xl border border-[#e2d8c3] bg-white">
              <div
                className="aspect-[16/9] w-full bg-cover bg-center"
                style={
                  coverUrl
                    ? { backgroundImage: `url(${coverUrl})` }
                    : {
                        background:
                          "linear-gradient(135deg, #2f7d4f 0%, #14281e 100%)",
                      }
                }
              />
              <div className="p-4">
                <span className="rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#a4651c]">
                  {category}
                </span>
                <h3 className="mt-3 font-display text-xl leading-tight text-[#14281e]">
                  {title || "Tiêu đề bài viết"}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#6b7a6f]">
                  {excerpt ||
                    content ||
                    "Mô tả ngắn của bài viết sẽ xuất hiện ở đây."}
                </p>
                <p className="mt-3 text-xs text-[#9a8f7a]">
                  {post?.author.name ?? "Bạn"} ·{" "}
                  {post
                    ? new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                      }).format(new Date(post.updatedAt))
                    : "Hôm nay"}
                </p>
              </div>
            </article>
          </div>

          <p className="rounded-2xl bg-[#f4ead5] px-4 py-3 text-xs leading-relaxed text-[#6b5a3d]">
            Bài viết sẽ ở trạng thái chờ duyệt cho đến khi quản trị viên phê
            duyệt. Bạn vẫn có thể chỉnh sửa và gửi lại.
          </p>
        </div>
      </div>
    </div>
  );
}
