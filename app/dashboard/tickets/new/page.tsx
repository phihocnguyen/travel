import type { Metadata } from "next";
import TicketEditor from "@/components/dashboard/TicketEditor";

export const instant = false;

export const metadata: Metadata = {
  title: "Tạo vé mới · Dong Thap Dashboard",
};

export default function NewTicketPage() {
  return <TicketEditor />;
}
