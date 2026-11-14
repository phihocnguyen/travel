import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function GET() {
  const font = await readFile(join(process.cwd(), 'public/fonts/chakra-petch/ChakraPetch-Bold.ttf'));

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fefbdf', color: '#215331', padding: '64px 72px', fontFamily: 'Chakra', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -120, top: -150, width: 630, height: 930, borderRadius: '50%', background: '#e2eca5', transform: 'rotate(25deg)' }} />
      <div style={{ position: 'absolute', right: 90, top: 180, width: 220, height: 300, borderRadius: '45% 55% 55% 45%', background: '#f4b824', transform: 'rotate(25deg)', border: '5px solid #e39b12' }} />
      <div style={{ position: 'absolute', right: 108, top: 120, width: 125, height: 70, borderRadius: '100% 0 100% 0', background: '#296b3d', transform: 'rotate(-20deg)' }} />
      <div style={{ display: 'flex', fontSize: 25, letterSpacing: 4, marginBottom: 28 }}>CAO LÃNH · ĐỒNG THÁP</div>
      <div style={{ display: 'flex', flexDirection: 'column', fontSize: 88, lineHeight: 1.15 }}>
        <span style={{ color: '#b87309' }}>VỊ XOÀI</span>
        <span>DẪN LỐI</span>
      </div>
      <div style={{ display: 'flex', fontSize: 30, marginTop: 32 }}>Theo vị xoài Cát, mở lối chu du</div>
      <div style={{ display: 'flex', fontSize: 22, marginTop: 36 }}>vixoaidanloi.com</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Chakra', data: font, weight: 700, style: 'normal' }] },
  );
}
