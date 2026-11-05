/** Set PNG print density without changing or recompressing its image pixels. */
export function pngWithDensity(source: Uint8Array, dpi: number): Uint8Array {
  const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const density = new Uint8Array(21);
  const densityView = new DataView(density.buffer);
  densityView.setUint32(0, 9);
  density.set([112, 72, 89, 115], 4); // pHYs
  const pixelsPerMeter = Math.round(dpi / 0.0254);
  densityView.setUint32(8, pixelsPerMeter);
  densityView.setUint32(12, pixelsPerMeter);
  density[16] = 1; // Unit: meters.
  let crc = 0xffffffff;
  for (const byte of density.subarray(4, 17)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  densityView.setUint32(17, (crc ^ 0xffffffff) >>> 0);

  const chunks = [source.subarray(0, 8)];
  for (let offset = 8; offset < source.length;) {
    const end = offset + view.getUint32(offset) + 12;
    const type = String.fromCharCode(...source.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") chunks.push(source.subarray(offset, end));
    if (type === "IHDR") chunks.push(density);
    offset = end;
  }
  const output = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
