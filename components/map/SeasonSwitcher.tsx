"use client";

import { useMapUI, type MapSeason } from "./MapUIContext";

const SEASONS: { id: MapSeason; label: string; caption: string; icon: string }[] = [
  { id: "mango", label: "Mango season", caption: "Golden groves · ripe fruit", icon: "🥭" },
  { id: "dry", label: "Dry season", caption: "Amber fields · clear skies", icon: "☀️" },
  { id: "flood", label: "Flood season", caption: "Rising water · silt", icon: "🌊" },
];

export function SeasonSwitcher() {
  const { season, setSeason } = useMapUI();
  return (
    <div role="group" aria-label="Chọn mùa tham quan" style={{ position: "absolute", zIndex: 60, bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, padding: 7, maxWidth: "calc(100vw - 24px)", borderRadius: 22, background: "rgba(8, 27, 21, 0.86)", border: "1px solid rgba(255,255,255,.2)", boxShadow: "0 12px 40px #0006", backdropFilter: "blur(18px)" }}>
      {SEASONS.map((entry) => {
        const active = season === entry.id;
        return (
          <button key={entry.id} type="button" aria-pressed={active} onClick={() => setSeason(entry.id)}
            style={{ border: active ? "1px solid #eed9a4" : "1px solid transparent", color: active ? "#17291d" : "#ecf5e9", background: active ? "#eddbab" : "transparent", borderRadius: 16, padding: "10px 15px", cursor: "pointer", minWidth: 100, textAlign: "left", fontFamily: "inherit", transition: "background .2s, color .2s" }}>
            <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{entry.icon} {entry.label}</div>
            <div style={{ fontSize: 10, opacity: .78, marginTop: 3, whiteSpace: "nowrap" }}>{entry.caption}</div>
          </button>
        );
      })}
    </div>
  );
}
