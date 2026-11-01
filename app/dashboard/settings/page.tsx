import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { getSession } from "@/lib/auth/session";

export const instant = false;

export const metadata: Metadata = {
  title: "Cài đặt · Dong Thap Dashboard",
};

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard/settings");
  }

  const rows = [
    { label: "Tên hiển thị", value: session.name },
    { label: "Email", value: session.email },
    {
      label: "Phương thức đăng nhập",
      value:
        session.provider === "google" ? "Google account" : "Email & mật khẩu",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
          Tài khoản
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Cài đặt
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Thông tin tài khoản và dữ liệu thiết kế của bạn.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-200 p-5">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 bg-cover bg-center text-lg font-bold text-white"
            style={
              session.picture
                ? { backgroundImage: `url(${session.picture})` }
                : undefined
            }
            aria-hidden="true"
          >
            {session.picture
              ? null
              : (session.name || session.email).charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{session.name}</p>
            <p className="truncate text-sm text-slate-500">{session.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
            >
              <dt className="text-sm text-slate-500">{row.label}</dt>
              <dd className="text-sm font-medium text-slate-800">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Dữ liệu thiết kế</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Mỗi lần lưu, nội dung vé, màu sắc, sticker, bố cục và ảnh đã cắt khung
          được gắn với tài khoản của bạn trên máy chủ. Bạn có thể quay lại chỉnh
          sửa bất cứ lúc nào từ mục{" "}
          <Link
            href="/dashboard/tickets"
            className="font-medium text-emerald-700 hover:underline"
          >
            Thiết kế vé
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">Phiên đăng nhập</h2>
          <p className="mt-1 text-sm text-slate-500">
            Đăng xuất khỏi dashboard trên thiết bị này.
          </p>
        </div>
        <LogoutButton />
      </section>
    </div>
  );
}
