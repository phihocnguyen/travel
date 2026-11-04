import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth/oauth";

export const metadata: Metadata = {
  title: "Đăng nhập · Vị Xoài Dẫn Lối",
  description:
    "Đăng nhập để lưu lại các trạm dừng và tiếp tục hành trình khám phá Cao Lãnh, Đồng Tháp.",
};

type LoginSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

type LoginPageProps = {
  searchParams: LoginSearchParams;
};

const ERROR_MESSAGES: Record<string, string> = {
  "email-unverified": "Vui lòng sử dụng tài khoản Google đã xác minh email.",
  "account-conflict": "Email này đã liên kết với tài khoản khác. Vui lòng liên hệ ban tổ chức.",
  "account-save-failed": "Chưa lưu được tài khoản. Vui lòng thử đăng nhập lại.",
  "account-disabled": "Tài khoản đã bị khóa. Vui lòng liên hệ ban tổ chức.",
  "google-not-configured":
    "Đăng nhập Google chưa được cấu hình. Vui lòng thêm thông tin Google OAuth để tiếp tục.",
  "google-denied": "Bạn đã huỷ đăng nhập Google.",
  "invalid-state":
    "Yêu cầu đăng nhập đã hết hạn hoặc không thể xác minh. Vui lòng thử lại.",
  "token-exchange-failed":
    "Google chưa thể hoàn tất đăng nhập. Vui lòng thử lại.",
  "profile-fetch-failed":
    "Không thể đọc hồ sơ Google của bạn. Vui lòng thử lại.",
  "google-unreachable":
    "Không thể kết nối tới Google từ máy chủ này. Vui lòng thử lại.",
  "profile-incomplete":
    "Tài khoản Google không trả về địa chỉ email.",
};

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function LoginCardSkeleton() {
  return (
    <section
      className="w-full max-w-md space-y-4 rounded-[2rem] bg-forest/95 p-7 shadow-brand sm:p-9"
      aria-hidden="true"
      aria-busy="true"
    >
      <span className="block h-2.5 w-16 animate-pulse rounded-full bg-cream/20" />
      <span className="block h-8 w-2/3 animate-pulse rounded-full bg-cream/20" />
      <span className="block h-3 w-full animate-pulse rounded-full bg-cream/10" />
      <span className="block h-12 w-full animate-pulse rounded-full bg-cream/15" />
      <span className="block h-px w-full bg-cream/15" />
      <span className="block h-12 w-full animate-pulse rounded-xl bg-cream/10" />
      <span className="block h-12 w-full animate-pulse rounded-xl bg-cream/10" />
      <span className="block h-12 w-full animate-pulse rounded-full bg-mango/50" />
    </section>
  );
}

async function LoginCard({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const next = safeNextPath(first(params.next));
  const errorCode = first(params.error);
  const initialError = errorCode
    ? ERROR_MESSAGES[errorCode] ?? "Không thể hoàn tất đăng nhập."
    : null;

  return (
    <section className="w-full max-w-md rounded-[2rem] bg-forest p-7 text-cream shadow-brand sm:p-9">
      <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.26em] text-mango">
        <span className="h-1.5 w-1.5 rounded-full bg-mango" />
        Thành viên
      </p>
      <h2 className="mt-3 font-display text-3xl leading-none text-cream">
        Chào mừng trở lại
      </h2>
      <p className="mt-3 text-[13px] leading-relaxed text-cream/70">
        Đăng nhập bằng Google. Tài khoản sẽ được tạo tự động trong lần đầu tiên.
      </p>

      <LoginForm next={next} initialError={initialError} />

      <span className="mt-6 block text-[9px] font-semibold uppercase tracking-[0.22em] text-cream/40">
        10.29° N · 105.76° E
      </span>
    </section>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="relative grid min-h-dvh grid-rows-[auto_1fr_auto] overflow-hidden bg-cream px-5 py-5 text-forest sm:px-8 sm:py-7 lg:px-14">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-mint/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-mango/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(127,175,45,0.16),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Vị Xoài Dẫn Lối — trang chủ">
          <Image
            src="/76cb5fbe-2b41-4e96-a4ee-00344fc4e9f2.jpg"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 object-contain mix-blend-multiply"
          />
          <span className="font-display text-[13px] leading-[0.95] tracking-tight text-forest sm:text-sm">
            Vị Xoài
            <br />
            Dẫn Lối
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-forest/60 transition-colors hover:text-forest"
        >
          <span aria-hidden>←</span>
          Về trang chủ
        </Link>
      </header>

      <div className="relative z-10 grid w-full max-w-6xl place-self-center items-center gap-10 py-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <section>
          <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-forest-mid">
            <span className="h-px w-7 bg-mango" />
            Khu vực thành viên
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.6rem,5.4vw,4.8rem)] leading-[0.95] tracking-[-0.03em] text-forest">
            Trở về
            <br />
            <span className="text-earth">miệt vườn.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-forest/70 sm:text-[15px]">
            Đăng nhập để giữ lại những trạm dừng, ghi chú theo mùa và nhịp trôi
            chậm của miền sông nước đúng nơi bạn đã để lại.
          </p>

          <ul className="mt-8 grid max-w-md gap-3 border-t border-forest/15 pt-6">
            {[
              "Lưu các trạm dừng trên bản đồ hành trình",
              "Ghi chú theo mùa: mùa xoài, mùa khô, mùa nước nổi",
              "Những chuyến đi riêng, chỉ dành cho thành viên",
            ].map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-[13px] leading-relaxed text-forest/70">
                <span className="font-display text-sm text-mango">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex justify-center lg:justify-end">
          <Suspense fallback={<LoginCardSkeleton />}>
            <LoginCard searchParams={searchParams} />
          </Suspense>
        </div>
      </div>

      <footer className="relative z-10 flex items-center justify-between gap-4 text-[8px] font-semibold uppercase tracking-[0.18em] text-forest/40">
        <span>Vị Xoài Dẫn Lối · Trạm Hẹn Cao Lãnh</span>
        <span className="hidden sm:block">Cao Lãnh · Đồng Tháp · 2026</span>
      </footer>
    </main>
  );
}
