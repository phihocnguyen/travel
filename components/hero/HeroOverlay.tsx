"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AmbientBed } from "@/lib/audio/ambient";
import type { Commune } from "@/lib/geo/types";
import { useMapUI } from "@/components/map/MapUIContext";

const MENU_ITEMS = [
  { label: "Tổng quan", note: "Đồng bằng sông Cửu Long" },
  { label: "Địa lý", note: "Sông Tiền · Sông Hậu" },
  { label: "Hành chính 2025", note: "102 xã, phường" },
  { label: "Sinh thái", note: "Tràm Chim · rừng ngập nước" },
];

function AudioIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        fill="currentColor"
        opacity={muted ? 0.55 : 1}
      />
      {muted ? (
        <path
          d="M16 9l5 6M21 9l-5 6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M5 12h13M12.5 6.5L19 12l-6.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function HeroOverlay() {
  const {
    explored,
    ready,
    loadProgress,
    explore,
    audioEnabled,
    setAudioEnabled,
    inquireOpen,
    setInquireOpen,
    menuOpen,
    setMenuOpen,
    showAdmin,
    toggleAdmin,
    selectedId,
    setSelectedId,
    setSelectedAttractionId,
  } = useMapUI();

  const [communes, setCommunes] = useState<Commune[]>([]);
  const [sent, setSent] = useState(false);
  const bed = useRef<AmbientBed | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/communes.json")
      .then((r) => r.json() as Promise<Commune[]>)
      .then((data) => {
        if (!cancelled) setCommunes(data);
      })
      .catch(() => {
        /* detail panel stays empty if data is unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (audioEnabled) {
      bed.current ??= new AmbientBed();
      bed.current.start();
    } else {
      bed.current?.stop();
      bed.current = null;
    }
  }, [audioEnabled]);

  useEffect(
    () => () => {
      bed.current?.stop();
      bed.current = null;
    },
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setInquireOpen(false);
      setMenuOpen(false);
      setSelectedId(null);
      setSelectedAttractionId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setInquireOpen, setMenuOpen, setSelectedId, setSelectedAttractionId]);

  const selected = selectedId == null ? null : communes[selectedId] ?? null;
  const progress = Math.round(loadProgress * 100);

  const submitInquire = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <div className={`hero-ui${explored ? " is-explored" : ""}`}>
      <div className="hero-mist" aria-hidden />

      <header className="hero-header">
        <button
          type="button"
          className="hero-nav-button"
          onClick={() => setMenuOpen(true)}
        >
          <span className="hero-menu-lines" aria-hidden>
            <span />
            <span />
          </span>
          Menu
        </button>

        <div className="hero-brand">
          <span className="hero-brand__name">Đồng Tháp</span>
          <span className="hero-brand__tag">Miền sông nước · 2025</span>
        </div>

        <div className="hero-header__right">
          <button
            type="button"
            className={`hero-nav-button hero-layer-toggle${showAdmin ? " is-on" : ""}`}
            onClick={toggleAdmin}
            aria-pressed={showAdmin}
          >
            <span className="hero-layer-dot" aria-hidden />
            Lớp hành chính
          </button>
          <button
            type="button"
            className="hero-cta hero-cta--small"
            onClick={() => {
              setSent(false);
              setInquireOpen(true);
            }}
          >
            Liên hệ
          </button>
        </div>
      </header>

      <section className="hero-center" aria-hidden={explored}>
        <p className="hero-kicker">
          <span className="hero-kicker__line" aria-hidden />
          Đồng bằng sông Cửu Long · Việt Nam
        </p>
        <h1 className="hero-title">Đồng Tháp</h1>
        <p className="hero-subtitle">
          Nơi dòng Tiền mở thành biển nước, những cánh đồng sen, vườn tràm và
          kênh rạch vẽ nên một miền đất hiền hòa.
        </p>
        <div className="hero-actions">
          <button
            type="button"
            className="hero-cta hero-cta--primary"
            onClick={() => explore(false)}
            disabled={!ready}
          >
            <span>{ready ? "Khám phá bản đồ" : "Đang tải bản đồ"}</span>
            <ArrowIcon />
          </button>
          <button
            type="button"
            className="hero-audio-link"
            onClick={() => explore(true)}
            disabled={!ready}
          >
            <AudioIcon muted={false} />
            Bắt đầu cùng âm thanh
          </button>
        </div>
      </section>

      {explored && !selected && (
        <div className="hero-hint">
          <span className="hero-hint__dot" aria-hidden />
          Chạm vào một xã, phường để xem chi tiết
        </div>
      )}

      <aside
        className={`commune-panel${selected ? " is-open" : ""}`}
        aria-hidden={!selected}
      >
        {selected && (
          <>
            <button
              type="button"
              className="commune-panel__close"
              onClick={() => setSelectedId(null)}
              aria-label="Đóng thông tin"
            >
              ×
            </button>
            <p className="commune-panel__eyebrow">Hành chính 2025</p>
            <p className="commune-panel__kind">{selected.kind}</p>
            <h2 className="commune-panel__name">{selected.name}</h2>
            <dl className="commune-panel__facts">
              <div>
                <dt>Tọa độ</dt>
                <dd>
                  {selected.lat.toFixed(4)}°N · {selected.lon.toFixed(4)}°E
                </dd>
              </div>
              <div>
                <dt>Vùng</dt>
                <dd>Đồng Tháp · Miền Tây Nam Bộ</dd>
              </div>
            </dl>
            <p className="commune-panel__copy">
              Đơn vị hành chính cấp xã thuộc tỉnh Đồng Tháp sau sắp xếp năm
              2025, nơi đồng bằng phù sa gặp hệ thống kênh rạch chằng chịt.
            </p>
            <button
              type="button"
              className="commune-panel__action"
              onClick={() => setSelectedId(null)}
            >
              Xem toàn cảnh
            </button>
          </>
        )}
      </aside>

      <footer className="hero-footer">
        <button
          type="button"
          className="hero-footer__audio"
          onClick={() => {
            if (!explored) explore(false);
            else setAudioEnabled(!audioEnabled);
          }}
        >
          <AudioIcon muted={!audioEnabled} />
          <span>
            {!explored
              ? "Bắt đầu không audio"
              : audioEnabled
                ? "Tắt âm thanh"
                : "Bật âm thanh"}
          </span>
        </button>

        <p className="hero-footer__hint">
          Kéo để xoay · Cuộn để phóng to · Chạm để chọn
        </p>

        <p className="hero-attribution">
          Ảnh vệ tinh © Esri, Maxar, Earthstar Geographics · Địa hình ©
          Mapzen/AWS · Dữ liệu © OpenStreetMap
        </p>
      </footer>

      <div
        className={`hero-loader${ready ? " is-done" : ""}`}
        aria-live="polite"
      >
        <div className="hero-loader__inner">
          <p className="hero-loader__brand">Đồng Tháp</p>
          <p className="hero-loader__label">
            {ready ? "Sẵn sàng" : "Đang dựng bản đồ sông nước"}
          </p>
          <div className="hero-loader__track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="hero-loader__percent">{progress}%</p>
        </div>
      </div>

      <div
        className={`hero-drawer${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="hero-drawer__head">
          <span className="hero-brand__name hero-brand__name--dark">
            Đồng Tháp
          </span>
          <button
            type="button"
            className="hero-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Đóng menu"
          >
            ×
          </button>
        </div>
        <nav className="hero-drawer__nav">
          {MENU_ITEMS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                if (index === 0 && !explored) explore(false);
              }}
            >
              <span className="hero-drawer__index">0{index + 1}</span>
              <span className="hero-drawer__label">{item.label}</span>
              <span className="hero-drawer__note">{item.note}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setSent(false);
              setInquireOpen(true);
            }}
          >
            <span className="hero-drawer__index">05</span>
            <span className="hero-drawer__label">Liên hệ</span>
            <span className="hero-drawer__note">Hợp tác · Truyền thông</span>
          </button>
        </nav>
        <p className="hero-drawer__foot">
          Bản đồ cinematic tỉnh Đồng Tháp · Ranh giới hành chính 2025
        </p>
      </div>

      {menuOpen && (
        <button
          type="button"
          className="hero-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      <div
        className={`inquire-modal${inquireOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Liên hệ"
        aria-hidden={!inquireOpen}
      >
        <div className="inquire-card">
          <button
            type="button"
            className="inquire-card__close"
            onClick={() => setInquireOpen(false)}
            aria-label="Đóng"
          >
            ×
          </button>
          <p className="inquire-card__eyebrow">Inquire</p>
          <h2 className="inquire-card__title">Kết nối với Đồng Tháp</h2>
          {sent ? (
            <p className="inquire-card__done">
              Cảm ơn bạn. Chúng tôi đã ghi nhận lời nhắn và sẽ phản hồi trong
              thời gian sớm nhất.
            </p>
          ) : (
            <form onSubmit={submitInquire} className="inquire-form">
              <label>
                <span>Họ và tên</span>
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label>
                <span>Lời nhắn</span>
                <textarea name="message" rows={3} required />
              </label>
              <button type="submit" className="hero-cta hero-cta--primary">
                Gửi lời nhắn
                <ArrowIcon />
              </button>
            </form>
          )}
        </div>
      </div>

      {inquireOpen && (
        <button
          type="button"
          className="hero-scrim"
          onClick={() => setInquireOpen(false)}
          aria-label="Đóng liên hệ"
        />
      )}
    </div>
  );
}
