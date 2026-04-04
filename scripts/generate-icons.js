#!/usr/bin/env node
/**
 * generate-icons.js
 * Creates the assets/ directory, writes the SVG, then generates
 * all platform-specific PNG/ICO sizes via sharp.
 * Run: node scripts/generate-icons.js
 */

const fs   = require('fs');
const path = require('path');

// ── Icon SVG ──────────────────────────────────────────────────────────────────
// Three isometric stacked layers — the "stack" in LocalStack.
// Middle layer in brand orange, outer layers in dark blue-grey.
// Floating endpoint dot at top. Works cleanly from 16px to 1024px.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Dark background -->
  <rect width="512" height="512" rx="112" fill="#16202D"/>

  <!-- Bottom layer (widest, dark blue-grey) -->
  <g transform="translate(256,320)">
    <polygon points="-132,0 0,-44 132,0 0,44"  fill="#2d4a6e"/>
    <polygon points="-132,0 0,44 0,88 -132,44" fill="#1a3050"/>
    <polygon points="132,0 0,44 0,88 132,44"   fill="#243d5e"/>
    <polyline points="-132,0 0,-44 132,0" fill="none" stroke="#FF9900" stroke-width="2.5" opacity="0.45"/>
  </g>

  <!-- Middle layer (orange — the highlighted "active" layer) -->
  <g transform="translate(256,248)">
    <polygon points="-110,0 0,-37 110,0 0,37"  fill="#FF9900"/>
    <polygon points="-110,0 0,37 0,74 -110,37" fill="#b36b00"/>
    <polygon points="110,0 0,37 0,74 110,37"   fill="#cc7a00"/>
    <polyline points="-110,0 0,-37 110,0" fill="none" stroke="#ffd080" stroke-width="2" opacity="0.55"/>
  </g>

  <!-- Top layer (narrowest, dark blue-grey) -->
  <g transform="translate(256,188)">
    <polygon points="-80,0 0,-27 80,0 0,27"  fill="#2d4a6e"/>
    <polygon points="-80,0 0,27 0,54 -80,27" fill="#1a3050"/>
    <polygon points="80,0 0,27 0,54 80,27"   fill="#243d5e"/>
    <polyline points="-80,0 0,-27 80,0" fill="none" stroke="#FF9900" stroke-width="2" opacity="0.5"/>
  </g>

  <!-- Floating endpoint dot — represents the live local AWS endpoint -->
  <circle cx="256" cy="142" r="16" fill="#FF9900"/>
  <circle cx="256" cy="142" r="9"  fill="#16202D"/>
  <circle cx="256" cy="142" r="4"  fill="#FF9900"/>
</svg>`;

const assetsDir = path.join(__dirname, '..', 'assets');
const publicDir = path.join(__dirname, '..', 'public');

// Always create assets/ if it doesn't exist — this was the source of the ENOENT error
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('✓ Created assets/ directory');
}

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), SVG);
console.log('✓ Written assets/icon.svg');

async function generatePNGs() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('Installing sharp for icon generation...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    sharp = require('sharp');
  }

  const svgBuf = Buffer.from(SVG);
  const sizes  = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

  for (const size of sizes) {
    const outPath = path.join(assetsDir, `icon-${size}.png`);
    await sharp(svgBuf).resize(size, size).png().toFile(outPath);
    console.log(`✓ assets/icon-${size}.png`);
  }

  // Main icon.png (512px) — used by Linux + generic fallback
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ assets/icon.png');

  // macOS: icns source (electron-builder converts from 512px PNG)
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(assetsDir, 'icon-mac.png'));
  console.log('✓ assets/icon-mac.png');

  // Windows: 256px PNG (electron-builder converts to .ico)
  await sharp(svgBuf).resize(256, 256).png().toFile(path.join(assetsDir, 'icon-win.png'));
  console.log('✓ assets/icon-win.png');

  // public/ — React dev server assets
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(publicDir, 'logo512.png'));
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(publicDir, 'logo192.png'));
  await sharp(svgBuf).resize(64,  64).png().toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ public/ icons (logo512, logo192, favicon)');

  console.log('\n✅  All icons generated.');
}

generatePNGs().catch(err => {
  console.error('Icon PNG generation failed:', err.message);
  console.log('The SVG was written to assets/icon.svg — run `npm install sharp` and try again.');
});
