import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standalone Icon SVG (with glow and dark background)
function getSvg(size = 512, isMaskable = false) {
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const contentSize = size - padding * 2;
  const center = size / 2;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Emerald-Cyan Glow Gradient -->
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="50%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Warm Golden Light Accent -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>

    <!-- Radial Glow Filter -->
    <radialGradient id="noorGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.45" />
      <stop offset="70%" stop-color="#06b6d4" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadow -->
    <filter id="glowDrop" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.03}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Base background (fills edge-to-edge for maskable compatibility) -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)" />

  ${!isMaskable ? `
  <!-- Inner subtle border for standard icons -->
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.22}" fill="none" stroke="rgba(16, 185, 129, 0.25)" stroke-width="3" />
  ` : ''}

  <!-- Ambient Glow in Center -->
  <circle cx="${center}" cy="${center}" r="${contentSize * 0.45}" fill="url(#noorGlow)" />

  <!-- Main Tasbeeh Beads Circular Arc -->
  <g transform="translate(${center}, ${center}) scale(${contentSize / 400})">
    <!-- Glow halo -->
    <circle cx="0" cy="0" r="140" fill="none" stroke="url(#brandGrad)" stroke-width="4" stroke-dasharray="8 12" opacity="0.6" filter="url(#glowDrop)" />

    <!-- Crescent Moon Emblem (Islamic Symbol of New Beginnings) -->
    <path d="M-20,-85 A 95 95 0 1 0 75,55 A 80 80 0 1 1 -20,-85 Z" fill="url(#brandGrad)" filter="url(#glowDrop)" />

    <!-- 8-Point Noor Star (Rub el Hizb element) -->
    <g transform="translate(42, -32) scale(0.95)">
      <polygon points="0,-32 8,-8 32,0 8,8 0,32 -8,8 -32,0 -8,-8" fill="url(#goldGrad)" filter="url(#glowDrop)" />
      <circle cx="0" cy="0" r="6" fill="#ffffff" />
    </g>

    <!-- Prayer Beads (Tasbeeh Beads Arc) -->
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x = Math.round(140 * Math.cos(rad));
      const y = Math.round(140 * Math.sin(rad));
      const r = i % 3 === 0 ? 9 : 6.5;
      const fill = i % 3 === 0 ? 'url(#goldGrad)' : 'url(#brandGrad)';
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`;
    }).join('\n    ')}

    <!-- Tasbeeh Imam / Tassel at bottom -->
    <path d="M0,140 L0,175 M-8,175 L8,175 M-14,195 L14,195 M-6,175 L-12,195 M6,175 L12,195 M0,175 L0,205" stroke="url(#goldGrad)" stroke-width="3.5" stroke-linecap="round" />
  </g>
</svg>
`;
}

async function run() {
  console.log('Generating PWA Icons...');

  // Standard 512
  const svg512 = getSvg(512, false);
  const svg192 = getSvg(192, false);
  const svgMaskable512 = getSvg(512, true);
  const svgMaskable192 = getSvg(192, true);

  // Write SVGs for reference & favicon
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg192);
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg512);

  // Generate PNGs with sharp
  await sharp(Buffer.from(svg512))
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-512.png'));

  await sharp(Buffer.from(svg192))
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-192.png'));

  await sharp(Buffer.from(svgMaskable512))
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-maskable-512.png'));

  await sharp(Buffer.from(svgMaskable192))
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'icon-maskable-192.png'));

  await sharp(Buffer.from(getSvg(180, false)))
    .png({ quality: 100 })
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  await sharp(Buffer.from(getSvg(32, false)))
    .png()
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));

  await sharp(Buffer.from(getSvg(16, false)))
    .png()
    .toFile(path.join(iconsDir, 'favicon-16x16.png'));

  console.log('All PWA Icons generated successfully!');
}

run().catch(err => {
  console.error('Error generating icons', err);
  process.exit(1);
});
