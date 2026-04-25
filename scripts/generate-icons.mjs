/**
 * Generates PWA icons and favicon from an inline SVG.
 * Strategy: render at 512px via qlmanage, then downscale with sips.
 * Run: node scripts/generate-icons.mjs
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const iconsDir = join(root, 'public', 'icons');
const publicDir = join(root, 'public');

mkdirSync(iconsDir, { recursive: true });

const SIZE = 512;
const r = Math.round(SIZE * 0.22);
const pad = Math.round(SIZE * 0.15);
const inner = SIZE - pad * 2;

const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" rx="${r}" ry="${r}" fill="#10b981"/>
  <g transform="translate(${pad}, ${pad})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C12 2 3 8.5 3 13.5C3 16.5 5.5 18 8 17C7 19 6 20.5 4 21H20C18 20.5 17 19 16 17C18.5 18 21 16.5 21 13.5C21 8.5 12 2 12 2Z"/>
    </svg>
  </g>
</svg>`;

// Write favicon SVG
writeFileSync(
  join(publicDir, 'favicon.svg'),
  svg512.replace(`width="${SIZE}" height="${SIZE}"`, 'width="32" height="32"')
);
console.log('✓ favicon.svg');

// Render 512px PNG via qlmanage
const svgTmp = join(iconsDir, '_source.svg');
const png512 = join(iconsDir, 'icon-512.png');
writeFileSync(svgTmp, svg512);
execSync(
  `qlmanage -t -s ${SIZE} -o "${iconsDir}" "${svgTmp}" 2>/dev/null && mv "${svgTmp}.png" "${png512}"`
);
execSync(`rm -f "${svgTmp}"`);
console.log('✓ icon-512.png (512x512)');

// Downscale from 512 for all other sizes
const scales = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of scales) {
  const out = join(iconsDir, name);
  execSync(`sips -z ${size} ${size} "${png512}" --out "${out}" 2>/dev/null`);
  console.log(`✓ ${name} (${size}x${size})`);
}

execSync(`cp "${join(iconsDir, 'icon-192.png')}" "${join(publicDir, 'favicon.png')}"`);
console.log('✓ favicon.png');
console.log('\nDone!');
