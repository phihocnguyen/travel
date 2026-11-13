export const FISH = [
  { id: "ro", name: "Cá rô đồng", note: "Vây lưng nhọn, thân xanh ô liu." },
  { id: "tre", name: "Cá trê", note: "Thân trơn, đôi râu dài bên miệng." },
  { id: "loc", name: "Cá lóc", note: "Thân dài, vằn sẫm dọc hai bên." },
] as const;

export default function FishArt({ index }: { index: number }) {
  const fish = FISH[index % FISH.length];
  return <svg viewBox="0 0 240 130" role="img" aria-label={fish.name} className="mg-fishArt">
    <ellipse cx="119" cy="112" rx="76" ry="6" fill="#395d4820"/>
    <g stroke="#405d46" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
      {fish.id === "ro" ? <>
        <path d="m81 46 5-18 13 10 8-20 11 15 13-17 9 20 17-10 1 23" fill="#87995c"/>
        <path d="M72 60 27 39l8 28-8 29 46-23" fill="#9ca467"/>
        <path d="M64 65c21-40 108-42 139 0-25 43-111 43-139 0Z" fill="#a6b578"/>
        <path d="M74 64c35-21 82-23 112-6M95 83l11 19 25-10" fill="#d0c886"/>
        <path d="m100 49 7 9-7 9 7 9m17-29 7 10-7 10 7 10m17-30 7 10-7 10 7 10" fill="none" stroke="#7d915c"/>
        <path d="m141 70-22 16 6-20M170 49q-14 18 0 35" fill="#8c9d64"/>
      </> : fish.id === "tre" ? <>
        <path d="m73 64-46-21 13 26-13 23 48-14m43-28 20-24 23 26m-47 32 24 19 23-19" fill="#929b84"/>
        <path d="M57 68c30-21 66-30 106-25 24 1 46 12 47 25-2 17-27 23-51 22-41 2-74-7-102-22Z" fill="#788b7b"/>
        <path d="M73 76q66 23 119 0" fill="#d7d3ad" stroke="none"/>
        <path d="m156 72-29 18 9-20" fill="#a2aa8b"/>
        <path d="M199 73q23-13 34-2m-35 7q22 6 30 20m-37-18q6 24 20 28" fill="none" stroke="#566d58"/>
      </> : <>
        <path d="m72 60-46-15 6 23-6 21 48-14M80 53q37-34 95-18l10 18M87 83l16 17 71-8 10-12" fill="#81976e"/>
        <path d="M55 68c34-19 96-28 135-17 19 6 28 17 19 26-37 28-108 16-154-9Z" fill="#b2b78a"/>
        <path d="m84 57 13 21m11-25 14 30m12-33 11 32m11-32 10 31" stroke="#6d8260" strokeWidth="7"/>
        <path d="m165 74-22 18 6-23M182 54q-9 13 1 28" fill="#93a375"/>
      </>}
      <circle cx={fish.id === "ro" ? 183 : 195} cy="61" r="5" fill="#fcf4ce" stroke="none"/>
      <circle cx={fish.id === "ro" ? 184 : 196} cy="61" r="2.7" fill="#293c32" stroke="none"/>
      <path d={fish.id === "ro" ? "m194 72 8-5" : "m202 75 8-3"} fill="none"/>
    </g>
  </svg>;
}
