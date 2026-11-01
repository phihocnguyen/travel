import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth/oauth";
import { isAuthBypassEnabled } from "@/lib/auth/session";
import "./login.css";

export const metadata: Metadata = {
  title: "Sign in · Dong Thap · The Waterways",
  description:
    "Sign in to the cinematic map of Dong Thap province and return to your checkpoints along the Tien and Hau rivers.",
};

type LoginSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

type LoginPageProps = {
  searchParams: LoginSearchParams;
};

const ERROR_MESSAGES: Record<string, string> = {
  "google-not-configured":
    "Google sign-in is not configured yet. Add your Google OAuth credentials to continue.",
  "google-denied": "Google sign-in was cancelled.",
  "invalid-state":
    "The sign-in request expired or could not be verified. Please try again.",
  "token-exchange-failed":
    "Google could not complete the sign-in. Please try again.",
  "profile-fetch-failed":
    "We could not read your Google profile. Please try again.",
  "google-unreachable":
    "Google could not be reached from this server. Please try again.",
  "profile-incomplete":
    "Your Google account did not return an email address.",
};

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function LoginCardSkeleton() {
  return (
    <section
      className="login-card login-card--loading"
      aria-hidden="true"
      aria-busy="true"
    >
      <span className="login-skeleton login-skeleton--eyebrow" />
      <span className="login-skeleton login-skeleton--title" />
      <span className="login-skeleton login-skeleton--text" />
      <span className="login-skeleton login-skeleton--button" />
      <span className="login-skeleton login-skeleton--divider" />
      <span className="login-skeleton login-skeleton--field" />
      <span className="login-skeleton login-skeleton--field" />
      <span className="login-skeleton login-skeleton--button" />
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
    ? ERROR_MESSAGES[errorCode] ?? "Sign-in could not be completed."
    : null;
  const bypass = isAuthBypassEnabled();

  return (
    <section className="login-card">
      <p className="login-card__eyebrow">Sign in</p>
      <h2 className="login-card__title">Welcome back</h2>
      <p className="login-card__lede">
        Use your Google account, or the email tied to this expedition.
      </p>

      {bypass ? (
        <p className="login-bypass">
          Local bypass is on — any sign-in opens the map.
        </p>
      ) : null}

      <LoginForm next={next} initialError={initialError} />

      <span className="login-card__coord" aria-hidden="true">
        10.29° N · 105.76° E
      </span>
    </section>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="login-shell">
      <div className="login-atmosphere" aria-hidden="true">
        <span className="login-sun" />
      </div>

      <header className="login-header">
        <Link href="/" className="login-brand" aria-label="Dong Thap home">
          <span className="login-brand__name">Dong Thap</span>
          <span className="login-brand__tag">The Waterways</span>
        </Link>
        <Link href="/" className="login-back">
          <span aria-hidden="true">←</span>
          Back to the map
        </Link>
      </header>

      <div className="login-layout">
        <section className="login-intro">
          <p className="login-kicker">
            <span className="login-kicker__line" aria-hidden="true" />
            Member access
          </p>
          <h1 className="login-headline">
            Return to
            <br />
            the waterways.
          </h1>
          <p className="login-lede">
            Sign in to keep your checkpoints, seasonal notes and the slow drift
            of the Tien and Hau rivers exactly where you left them.
          </p>

          <ul className="login-notes">
            <li>
              <span>01</span>
              Saved checkpoints across the 2025 administrative map
            </li>
            <li>
              <span>02</span>
              Seasonal layers, tides and the alluvial delta
            </li>
            <li>
              <span>03</span>
              Private, invitation-only expeditions
            </li>
          </ul>
        </section>

        <Suspense fallback={<LoginCardSkeleton />}>
          <LoginCard searchParams={searchParams} />
        </Suspense>
      </div>

      <footer className="login-footer">
        <span>Dong Thap · The Waterways</span>
        <span>Mekong Delta, Vietnam</span>
      </footer>
    </main>
  );
}
