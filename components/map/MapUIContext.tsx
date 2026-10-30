"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MapUI = {
  explored: boolean;
  audioEnabled: boolean;
  inquireOpen: boolean;
  menuOpen: boolean;
  showAdmin: boolean;
  hoveredId: number | null;
  selectedId: number | null;
  selectedAttractionId: number | null;
  loadProgress: number;
  ready: boolean;
  explore: (withAudio: boolean) => void;
  setAudioEnabled: (v: boolean) => void;
  setInquireOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  toggleAdmin: () => void;
  setHoveredId: (id: number | null) => void;
  setSelectedId: (id: number | null) => void;
  setSelectedAttractionId: (id: number | null) => void;
  setLoadProgress: (n: number) => void;
  setReady: (v: boolean) => void;
};

const Ctx = createContext<MapUI | null>(null);

export function MapUIProvider({ children }: { children: ReactNode }) {
  const [explored, setExplored] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [inquireOpen, setInquireOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);

  const explore = useCallback((withAudio: boolean) => {
    setAudioEnabled(withAudio);
    setExplored(true);
  }, []);

  const toggleAdmin = useCallback(() => setShowAdmin((v) => !v), []);

  const value = useMemo(
    () => ({
      explored,
      audioEnabled,
      inquireOpen,
      menuOpen,
      showAdmin,
      hoveredId,
      selectedId,
      selectedAttractionId,
      loadProgress,
      ready,
      explore,
      setAudioEnabled,
      setInquireOpen,
      setMenuOpen,
      toggleAdmin,
      setHoveredId,
      setSelectedId,
      setSelectedAttractionId,
      setLoadProgress,
      setReady,
    }),
    [
      explored,
      audioEnabled,
      inquireOpen,
      menuOpen,
      showAdmin,
      hoveredId,
      selectedId,
      selectedAttractionId,
      loadProgress,
      ready,
      explore,
      toggleAdmin,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMapUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapUI must be used within MapUIProvider");
  return ctx;
}
