// Package the shared, full-bleed artwork; corner masks belong to the UI/OS.
import sharp from 'sharp';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source =
  process.argv[2] ||
  fileURLToPath(
    new URL('../../design/generated/icon/nonogram-trip-full-bleed.png', import.meta.url),
  );
const out = fileURLToPath(new URL('../public/', import.meta.url));
const icon = sharp(source).removeAlpha();
await fs.mkdir(`${out}/images`, { recursive: true });
for (const [name, size] of [
  ['hero-icon-art', 1024],
  ['app-icon', 512],
  ['app-icon-small', 96],
]) {
  await icon.clone().resize(size, size).webp({ quality: 90 }).toFile(`${out}/images/${name}.webp`);
}
for (const [name, size] of [
  ['icon-192', 192],
  ['icon-512', 512],
  ['apple-touch-icon', 180],
]) {
  await icon.clone().resize(size, size).png().toFile(`${out}/${name}.png`);
}
// ICO supports a PNG payload, retaining full colour at the favicon size.
const png = await icon.clone().resize(48, 48).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 48;
header[7] = 48;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await fs.writeFile(`${out}/favicon.ico`, Buffer.concat([header, png]));
console.log('Packaged shared artwork into seven full-bleed website icon assets.');
