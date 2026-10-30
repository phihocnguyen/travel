# Immersive 3D Scroll Journey — Next.js + R3F + GSAP

## Install

```bash
npm install gsap
```

## Copy files

Copy the 11 root `*.tsx` files into `components/map/` (overwrite previous versions).
Copy `components/journey/` into the matching `components/journey/` folder in your project.

**Existing `components/hero/AttractionModal.tsx` remains required.**
The old HeroOverlay is intentionally not rendered in journey mode to avoid overlapping intro screens. If you need its original menu/audio/inquiry buttons, port those controls into JourneyOverlay.

## How it works

- `MapExperience` creates a tall scroll-space (`650dvh`) containing a sticky 100dvh stage with the MapCanvas and JourneyOverlay.
- `JourneyOverlay` reads the native document scroll (no GSAP pin) and converts position to progress (0..1).
- The progress is a ref (`journeyProgress`), so 60fps scroll updates don't cause React re-renders.
- `CameraRig` reads progress each WebGL frame and follows interpolated camera keyframes.
- The text chapters cross-fade in a pinned experience rather than normal vertical document scroll.
- Final chapter CTA enables OrbitControls; click markers to open existing AttractionModal.

## Customize

- Text and content: `components/journey/journeyData.ts` → `JOURNEY_CHAPTERS`.
- Camera path: `components/journey/journeyData.ts` → `JOURNEY_POSES`.
- Typography and layout: `components/journey/journey.css`.
- Scroll distance: `components/journey/journey.css` → `.journey-scroll-space { height: 650dvh; }`.

## Caveats

- The uploaded project did not contain `HeroOverlay.tsx`, `AttractionModal.tsx`, app layout, CSS or `lib/map`. So full-project typecheck and browser smoke test are still required.
- You must run the original application to verify JSX runtime, exact assets, camera framing, and your Next.js bundler settings.
- Journey currently runs via `ScrollTrigger`, not Oryzo's proprietary camera/shader engine.
- The new intro intentionally replaces (rather than edits) the missing HeroOverlay component.
- Page-level scroll must be enabled: remove `h-dvh overflow-hidden`, `fixed inset-0` or `overflow-y-hidden` from ancestors of MapExperience. Keep overflow hidden only inside the 100dvh stage if needed.
- `document.documentElement.scrollHeight` must exceed `window.innerHeight` before the journey can advance.
