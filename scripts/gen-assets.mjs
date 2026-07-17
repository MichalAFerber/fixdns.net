// One-off asset generator: og.png (1200x630) + favicon.ico (16/32/48 PNG-in-ICO).
// Run with: node scripts/gen-assets.mjs   (requires: npm i --no-save sharp)
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const ogSvg = readFileSync(new URL('./og-card.svg', import.meta.url));
await sharp(ogSvg, { density: 144 }).resize(1200, 630).png().toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('wrote public/og.png');

// favicon.ico — rasterize favicon.svg at 16/32/48 and pack PNGs into an ICO container.
const favSvg = readFileSync(new URL('../public/favicon.svg', import.meta.url));
const sizes = [16, 32, 48];
const pngs = [];
for (const s of sizes) {
  pngs.push(await sharp(favSvg, { density: 384 }).resize(s, s).png().toBuffer());
}

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);          // reserved
header.writeUInt16LE(1, 2);          // type: icon
header.writeUInt16LE(sizes.length, 4);

const entries = [];
let offset = 6 + 16 * sizes.length;
for (let i = 0; i < sizes.length; i++) {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0); // width
  e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1); // height
  e.writeUInt8(0, 2);                // palette
  e.writeUInt8(0, 3);                // reserved
  e.writeUInt16LE(1, 4);             // planes
  e.writeUInt16LE(32, 6);            // bpp
  e.writeUInt32LE(pngs[i].length, 8);
  e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  entries.push(e);
}

writeFileSync(new URL('../public/favicon.ico', import.meta.url).pathname, Buffer.concat([header, ...entries, ...pngs]));
console.log('wrote public/favicon.ico');
