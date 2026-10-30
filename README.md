# Đồng Tháp · Miền sông nước

Landing cinematic 3D cho tỉnh Đồng Tháp (ranh giới sau sắp xếp 2025), dựng bằng
Next.js 16, React Three Fiber và Three.js.

## Chạy locally

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```

## Cấu trúc

- `components/hero/HeroOverlay.tsx` — HUD cinematic: menu, headline, CTA, panel
  xã/phường, audio, loading.
- `components/map/MapScene.tsx` — R3F Canvas, ánh sáng, sương, camera fly-in.
- `components/map/Terrain.tsx` — mesh địa hình từ DEM, sông/kênh, viền tỉnh.
- `components/map/AdminOverlay.tsx` — overlay hành chính, hover/click, label LOD.
- `lib/map/assets.ts` — tải tile vệ tinh/DEM, dựng mask, texture overlay.
- `lib/geo/` — Mercator, polygon helpers, nạp dữ liệu.
- `public/geo/` — outline tỉnh, sông/kênh, 102 xã/phường.
- `app/api/tiles/` — proxy tile ảnh Esri và DEM Terrarium (không cần token).

## Nguồn dữ liệu

- Ảnh vệ tinh: Esri World Imagery (© Esri, Maxar, Earthstar Geographics).
- Cao độ: AWS Terrarium / Mapzen.
- Ranh giới, sông/kênh, hành chính: OpenStreetMap contributors.

Overlay xã/phường được dựng từ tâm các đơn vị hành chính trong
`public/geo/communes.json` (chia theo Voronoi trong ranh tỉnh) để giữ hiệu năng
và kích thước bundle; thay bằng polygon GeoJSON thật bằng cách cập nhật
`lib/map/assets.ts`.
