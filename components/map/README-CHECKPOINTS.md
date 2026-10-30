# Checkpoint-based cinematic journey

Changes: `components/journey/journeyData.ts`, `components/map/CameraRig.tsx`, `components/map/MapScene.tsx`, and `components/journey/journey.css`.

- Four marker locations are selected at approximately even indices from `ATTRACTIONS`; actual longitude/latitude are projected using the existing map projector.
- Camera positions and look-at targets follow separate Catmull-Rom splines, with eased arrivals and pauses for reading.
- Wheel / trackpad progress still comes from the existing native-scroll GSAP ScrollTrigger.
- Chapters now show actual marker names and their categories. Descriptions are clearly marked templates.
- Final chapter returns to a wider view; Explore enables OrbitControls.

## Apply
Copy these files into the corresponding project `components/map` and `components/journey` directories. Keep the fixed scrolling setup in `app/page.tsx` and `app/globals.css` from the previous root scroll fix. `npm install` is not needed because GSAP is already in package.json.

## Limitation
This patch has not been run against the complete app, since the `lib/map/attractions.ts` and loader sources have not been supplied. No marker coordinates or real place descriptions were invented.
