export const POST_STATUSES = ["pending", "approved", "rejected"] as const;

export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_CATEGORIES = [
  "Điểm đến",
  "Ẩm thực",
  "Cẩm nang",
  "Kinh nghiệm",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export type PostAuthor = {
  sub: string;
  name: string;
  email: string;
};

export type BlogPost = {
  id: string;
  title: string;
  category: PostCategory;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  status: PostStatus;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export type PostInput = {
  title: string;
  category: PostCategory;
  excerpt: string;
  content: string;
  coverImageDataUrl?: string | null;
  removeCover?: boolean;
};

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};
