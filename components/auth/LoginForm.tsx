"use client";

import { useState } from "react";

type Props = {
  next: string;
  initialError: string | null;
};

export function LoginForm({ next, initialError }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Đăng nhập thất bại. Vui lòng thử lại.");
        setSubmitting(false);
        return;
      }

      window.location.assign(next);
    } catch {
      setError("Mạng đang không ổn định. Vui lòng thử lại.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      <a
        className="flex items-center justify-center gap-3 rounded-full bg-cream px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-forest transition-colors hover:bg-mint"
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.05-1.26-.16-1.86H9v3.53h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.65Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.15l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.75a5.4 5.4 0 0 1 0-3.5V4.92H.96a9 9 0 0 0 0 8.16l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.55c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.92l3.01 2.33C4.68 5.13 6.66 3.55 9 3.55Z"
          />
        </svg>
        <span>Tiếp tục với Google</span>
      </a>

      <div className="my-6 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.24em] text-cream/40">
        <span className="h-px flex-1 bg-cream/15" />
        hoặc đăng nhập bằng email
        <span className="h-px flex-1 bg-cream/15" />
      </div>

      {error ? (
        <p
          className="mb-4 rounded-xl bg-earth/30 px-4 py-3 text-[11px] leading-relaxed text-cream"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-cream/50">
            Email
          </span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-mango focus:outline-none"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-[8px] font-bold uppercase tracking-[0.22em] text-cream/50">
            Mật khẩu
          </span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-cream/20 bg-cream/10 px-4 py-3 pr-16 text-sm text-cream placeholder:text-cream/30 focus:border-mango focus:outline-none"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Ẩn" : "Hiện"}
            </button>
          </span>
        </label>

        <button
          type="submit"
          className="mt-1 rounded-full bg-mango px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-forest transition-colors hover:bg-mango-bright disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Đang mở lối…" : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-5 text-[10px] leading-relaxed text-cream/40">
        Đăng nhập bằng email chỉ dành cho tài khoản đã được cấp. Khi tiếp tục,
        bạn đồng ý với điều khoản hành trình và việc sử dụng bản đồ một cách tôn
        trọng.
      </p>
    </div>
  );
}
