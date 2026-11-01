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
        setError(payload?.error ?? "Sign-in failed. Please try again.");
        setSubmitting(false);
        return;
      }

      window.location.assign(next);
    } catch {
      setError("The network is quiet right now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="login-form">
      <a
        className="login-google"
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
      >
        <svg
          className="login-google__icon"
          viewBox="0 0 18 18"
          aria-hidden="true"
        >
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
        <span>Continue with Google</span>
      </a>

      <div className="login-divider">
        <span>or sign in with email</span>
      </div>

      {error ? (
        <p className="login-alert" role="alert">
          {error}
        </p>
      ) : null}

      <form className="login-fields" onSubmit={handleSubmit} noValidate>
        <label className="login-field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="login-field">
          <span>Password</span>
          <span className="login-field__control">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              className="login-field__toggle"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>

        <button
          type="submit"
          className="login-submit"
          disabled={submitting}
        >
          {submitting ? "Opening the gates…" : "Sign in"}
        </button>
      </form>

      <p className="login-card__fine">
        Email sign-in is limited to provisioned accounts. By continuing you
        agree to the expedition terms and the respectful use of the delta map.
      </p>
    </div>
  );
}
