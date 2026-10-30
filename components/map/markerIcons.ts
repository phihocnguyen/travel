import { ExtrudeGeometry, Shape } from "three";

export type MarkerIconKind =
  | "pagoda"
  | "house"
  | "lotus"
  | "market"
  | "palm"
  | "mango"
  | "landmark";

type Point = [number, number];

// Each icon is a symmetric SVG-style silhouette. We generate a real extruded
// mesh from it so the checkpoint markers read as small 3D objects rather than
// flat billboards or primitive boxes.
function silhouette(rightSide: Point[]) {
  const shape = new Shape();
  shape.moveTo(-rightSide[0][0], rightSide[0][1]);
  shape.lineTo(rightSide[0][0], rightSide[0][1]);
  for (let i = 1; i < rightSide.length; i++) {
    shape.lineTo(rightSide[i][0], rightSide[i][1]);
  }
  for (let i = rightSide.length - 2; i >= 0; i--) {
    shape.lineTo(-rightSide[i][0], rightSide[i][1]);
  }
  shape.closePath();
  return shape;
}

const PAGODA: Point[] = [
  [0.54, 0],
  [0.52, 0.1],
  [0.36, 0.13],
  [0.34, 0.4],
  [0.57, 0.45],
  [0.3, 0.56],
  [0.28, 0.78],
  [0.49, 0.83],
  [0.24, 0.94],
  [0.18, 1.08],
  [0.31, 1.12],
  [0.1, 1.2],
  [0.04, 1.3],
  [0, 1.4],
];

const LOTUS: Point[] = [
  [0.58, 0.02],
  [0.5, 0.1],
  [0.62, 0.26],
  [0.32, 0.34],
  [0.46, 0.52],
  [0.2, 0.56],
  [0.3, 0.74],
  [0.1, 0.78],
  [0.08, 0.94],
  [0, 1.1],
];

const HOUSE: Point[] = [
  [0.5, 0],
  [0.5, 0.45],
  [0.62, 0.5],
  [0.18, 0.88],
  [0, 1.03],
];

const PALM: Point[] = [
  [0.05, 0],
  [0.05, 0.6],
  [0.2, 0.55],
  [0.35, 0.7],
  [0.25, 0.8],
  [0.42, 0.9],
  [0.3, 1],
  [0.1, 1.05],
  [0, 1.12],
];

const MARKET: Point[] = [
  [0.62, 0],
  [0.62, 0.12],
  [0.48, 0.16],
  [0.48, 0.52],
  [0.6, 0.58],
  [0.32, 0.64],
  [0.32, 0.74],
  [0.55, 0.8],
  [0.22, 0.9],
  [0, 1],
];

const LANDMARK: Point[] = [
  [0.36, 0],
  [0.36, 0.14],
  [0.24, 0.18],
  [0.2, 0.5],
  [0.12, 0.56],
  [0.1, 0.74],
  [0.04, 0.8],
  [0.02, 0.92],
  [0, 1.02],
];

const MANGO: Point[] = [
  [0.08, 0],
  [0.08, 0.34],
  [0.24, 0.48],
  [0.16, 0.56],
  [0.34, 0.64],
  [0.26, 0.72],
  [0.44, 0.84],
  [0.34, 0.94],
  [0.46, 1.02],
  [0.28, 1.08],
  [0.14, 1.18],
  [0, 1.24],
];

const SHAPES: Record<MarkerIconKind, Point[]> = {
  pagoda: PAGODA,
  house: HOUSE,
  lotus: LOTUS,
  market: MARKET,
  palm: PALM,
  landmark: LANDMARK,
  mango: MANGO,
};

const geometryCache = new Map<MarkerIconKind, ExtrudeGeometry>();

export function getMarkerIconGeometry(kind: MarkerIconKind) {
  const cached = geometryCache.get(kind);
  if (cached) return cached;

  const geometry = new ExtrudeGeometry(silhouette(SHAPES[kind]), {
    depth: 0.16,
    steps: 1,
    bevelEnabled: true,
    bevelSize: 0.014,
    bevelThickness: 0.018,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // Extrude along Z from 0..depth; centre it on the icon plane.
  geometry.translate(0, 0, -0.08);
  geometry.computeVertexNormals();
  geometryCache.set(kind, geometry);
  return geometry;
}
