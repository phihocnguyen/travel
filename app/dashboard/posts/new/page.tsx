import type { Metadata } from "next";
import PostEditor from "@/components/dashboard/PostEditor";

export const instant = false;

export const metadata: Metadata = {
  title: "Viết bài mới · Dong Thap Dashboard",
};

export default function NewPostPage() {
  return <PostEditor />;
}
