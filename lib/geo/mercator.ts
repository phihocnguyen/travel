const R = 6378137;
const D2R = Math.PI / 180;

export function lonLatToMeters(lon: number, lat: number): [number, number] {
  const x = R * lon * D2R;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2));
  return [x, y];
}

export function metersToLonLat(x: number, y: number): [number, number] {
  const lon = (x / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
  return [lon, lat];
}

export function lon2tile(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

export function lat2tile(lat: number, z: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      2 ** z,
  );
}

export function tile2lon(x: number, z: number) {
  return (x / 2 ** z) * 360 - 180;
}

export function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function terrariumToMeters(r: number, g: number, b: number) {
  return r * 256 + g + b / 256 - 32768;
}
