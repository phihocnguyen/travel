"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";

type MapUI = {
  explored: boolean;
  audioEnabled: boolean;
  inquireOpen: boolean;
  menuOpen: boolean;
  hoveredId: number | null;
  selectedAttractionId: number | null;
  loadProgress: number;
  ready: boolean;
  activeChapter: number;
  season: "mango" | "dry" | "flood";
  setSeason: (v: "mango" | "dry" | "flood") => void;
  setActiveChapter: (v: number) => void;
  journeyProgress: MutableRefObject<number>;
  explore: (withAudio: boolean) => void;
  setAudioEnabled: (v: boolean) => void;
  setInquireOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setHoveredId: (id: number | null) => void;
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
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedAttractionId, setSelectedAttractionId] = useState<
    number | null
  >(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const journeyProgress = useRef(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [season, setSeason] = useState<"mango" | "dry" | "flood">("mango");

  const explore = useCallback((withAudio: boolean) => {
    setAudioEnabled(withAudio);
    setExplored(true);
  }, []);

  const value = useMemo(
    () => ({
      explored,
      audioEnabled,
      inquireOpen,
      menuOpen,
      hoveredId,
      selectedAttractionId,
      loadProgress,
      ready,
      journeyProgress,
      activeChapter, setActiveChapter, season, setSeason,
      explore,
      setAudioEnabled,
      setInquireOpen,
      setMenuOpen,
      setHoveredId,
      setSelectedAttractionId,
      setLoadProgress,
      setReady,
    }),
    [
      explored,
      audioEnabled,
      inquireOpen,
      menuOpen,
      hoveredId,
      selectedAttractionId,
      loadProgress,
      ready, activeChapter, season,
      explore,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMapUI() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMapUI must be used within MapUIProvider");
  return ctx;
}
