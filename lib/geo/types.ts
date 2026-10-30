import type { GeoGeometry } from "./polygon";

export type Neighbor = {
  name: string;
  lon: number;
  lat: number;
};

export type RegionMeta = {
  bbox: [number, number, number, number];
  center: [number, number];
  neighbors: Neighbor[];
};

export type Commune = {
  id: number;
  name: string;
  kind: string;
  lon: number;
  lat: number;
  color: string;
};

export type OutlineCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { name: string };
    geometry: GeoGeometry;
  }>;
};

export type RiverCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { name: string };
    geometry: {
      type: "LineString" | "MultiLineString";
      coordinates: number[][] | number[][][];
    };
  }>;
};
