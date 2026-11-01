"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";

type User = {
  name: string;
  email: string;
  picture?: string;
  provider: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function OverviewIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4V8Z" />
      <path d="M9 7v2M9 15v2" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5Z" />
      <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" />
      <path d="M8 7h8M8 11h5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/tickets") {
    return (
      pathname === "/dashboard/tickets" ||
      (/^\/dashboard\/tickets\/[^/]+$/.test(pathname) &&
        !pathname.endsWith("/new"))
    );
  }
  if (href === "/dashboard/posts") {
    return (
      pathname === "/dashboard/posts" ||
      (/^\/dashboard\/posts\/[^/]+$/.test(pathname) &&
        !pathname.endsWith("/new"))
    );
  }
  return pathname === href;
}

function pageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Tổng quan";
  if (pathname === "/dashboard/tickets") return "Bộ sưu tập vé";
  if (pathname === "/dashboard/tickets/new") return "Thiết kế vé mới";
  if (pathname === "/dashboard/posts") return "Bài viết của tôi";
  if (pathname === "/dashboard/posts/new") return "Viết bài mới";
  if (pathname === "/dashboard/admin") return "Duyệt bài viết";
  if (pathname === "/dashboard/settings") return "Cài đặt";
  if (pathname.startsWith("/dashboard/tickets/")) return "Chỉnh sửa vé";
  if (pathname.startsWith("/dashboard/posts/")) return "Chỉnh sửa bài viết";
  return "Dashboard";
}

function initials(name: string, email: string): string {
  return (name.trim() || email).charAt(0).toUpperCase() || "?";
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? "bg-[#f4ead5]/10 font-semibold text-[#fdf8ec]"
          : "text-[#f4ead5]/55 hover:bg-white/5 hover:text-[#fdf8ec]/90"
      }`}
    >
      {active ? (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#e8b04b]" />
      ) : null}
      <span
        className={
          active
            ? "text-[#e8b04b]"
            : "text-[#f4ead5]/35 group-hover:text-[#f4ead5]/60"
        }
      >
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-[#e8b04b] px-1.5 py-0.5 text-[10px] font-bold text-[#14281e]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function DashboardShell({
  user,
  isAdmin = false,
  pendingCount = 0,
  children,
}: {
  user: User;
  isAdmin?: boolean;
  pendingCount?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  const journeyNav: NavItem[] = [
    { href: "/dashboard", label: "Tổng quan", icon: <OverviewIcon /> },
    { href: "/dashboard/tickets", label: "Bộ sưu tập vé", icon: <TicketIcon /> },
    { href: "/dashboard/tickets/new", label: "Tạo vé mới", icon: <PlusIcon /> },
  ];

  const storyNav: NavItem[] = [
    { href: "/dashboard/posts", label: "Bài viết của tôi", icon: <BookIcon /> },
    { href: "/dashboard/posts/new", label: "Viết bài mới", icon: <PenIcon /> },
  ];

  if (isAdmin) {
    storyNav.push({
      href: "/dashboard/admin",
      label: "Duyệt bài",
      icon: <ShieldIcon />,
      badge: pendingCount,
    });
  }

  return (
    <div className="min-h-dvh bg-[#f6f1e6] text-[#14281e]">
      {open ? (
        <button
          aria-label="Đóng menu"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-[#0b1a13]/50 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#14281e] text-[#f4ead5] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="leading-none">
            <span className="block font-display text-xl tracking-[0.08em] text-[#fdf8ec]">
              Dong Thap
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.32em] text-[#e8b04b]">
              The Waterways
            </span>
          </Link>

          <button
            onClick={closeMenu}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
            aria-label="Đóng menu"
          >
            <svg {...iconProps}>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#f4ead5]/30">
              Hành trình
            </p>
            {journeyNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onNavigate={closeMenu}
              />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#f4ead5]/30">
              Câu chuyện
            </p>
            {storyNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onNavigate={closeMenu}
              />
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-[#f4ead5]/30">
              Tài khoản
            </p>
            <NavLink
              item={{
                href: "/dashboard/settings",
                label: "Cài đặt",
                icon: <SettingsIcon />,
              }}
              active={isActive(pathname, "/dashboard/settings")}
              onNavigate={closeMenu}
            />
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <Link
            href="/blog"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#f4ead5]/55 transition hover:bg-white/5 hover:text-[#fdf8ec]/90"
          >
            <span className="text-[#f4ead5]/35">
              <BookIcon />
            </span>
            Blog công khai
          </Link>
          <Link
            href="/"
            className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#f4ead5]/55 transition hover:bg-white/5 hover:text-[#fdf8ec]/90"
          >
            <span className="text-[#f4ead5]/35">
              <MapIcon />
            </span>
            Về bản đồ
          </Link>

          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2f7d4f] bg-cover bg-center text-xs font-bold text-white"
              style={
                user.picture
                  ? { backgroundImage: `url(${user.picture})` }
                  : undefined
              }
              aria-hidden="true"
            >
              {user.picture ? null : initials(user.name, user.email)}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#fdf8ec]/90">
                {user.name}
              </p>
              <p className="truncate text-xs text-[#f4ead5]/40">{user.email}</p>
            </div>
          </div>

          <LogoutButton className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-medium text-[#f4ead5]/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50" />
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#e2d8c3] bg-[#fffdf7]/90 px-4 backdrop-blur md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-[#e2d8c3] p-2 text-[#3c5145] hover:bg-[#f4ead5] lg:hidden"
            aria-label="Mở menu"
          >
            <svg {...iconProps}>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#a4651c]">
              Dong Thap dashboard
            </p>
            <p className="truncate text-sm font-semibold text-[#14281e]">
              {pageTitle(pathname)}
            </p>
          </div>

          <Link
            href="/dashboard/tickets/new"
            className="hidden items-center gap-2 rounded-xl bg-[#14281e] px-4 py-2 text-sm font-semibold text-[#f7f1e4] transition hover:bg-[#1d3a2a] sm:inline-flex"
          >
            <svg {...iconProps} width={14} height={14}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Vé mới
          </Link>
          <Link
            href="/dashboard/posts/new"
            className="hidden items-center gap-2 rounded-xl border border-[#d9cdb4] bg-white px-4 py-2 text-sm font-semibold text-[#3c5145] transition hover:bg-[#f7f1e4] sm:inline-flex"
          >
            <PenIcon />
            Viết bài
          </Link>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
