import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

// SVG Definition of the Official SIMKA Emerald Mosque Logo
// 512x512 canvas with emerald gradient rounded squircle container,
// gold crescent & star, emerald dome with gold accent arch,
// two minarets with gold spires, central arch doorway with gold trim, side windows,
// and horizontal gold ground base line.
const simkaMosqueLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Emerald Squircle Gradient -->
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A878"/>
      <stop offset="45%" stop-color="#008761"/>
      <stop offset="100%" stop-color="#044734"/>
    </linearGradient>

    <!-- Main Dome Gradient -->
    <linearGradient id="dome-grad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#00E6A8"/>
      <stop offset="100%" stop-color="#008761"/>
    </linearGradient>

    <!-- Base Building Gradient -->
    <linearGradient id="base-grad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#009E71"/>
      <stop offset="100%" stop-color="#005A40"/>
    </linearGradient>

    <!-- Subtle inner border gradient -->
    <linearGradient id="border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00FFBC" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#005A40" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- 1. Emerald Container with Rounded Corners (Squircle) -->
  <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#bg-grad)"/>
  <rect x="4" y="4" width="504" height="504" rx="108" fill="none" stroke="url(#border-grad)" stroke-width="4"/>

  <!-- 2. Crescent & Star at top - Gold #F4B942 -->
  <path
    d="M 256 42 C 269 42 280 47 288 55 C 275 58 266 69 266 82 C 266 95 275 106 288 109 C 280 117 269 122 256 122 C 234 122 216 104 216 82 C 216 60 234 42 256 42 Z"
    fill="#F4B942"
  />
  <circle cx="285" cy="82" r="9.5" fill="#F4B942" />

  <!-- 3. Center Main Dome -->
  <path
    d="M 256 120 C 200 120 160 168 160 232 L 352 232 C 352 168 312 120 256 120 Z"
    fill="url(#dome-grad)"
  />
  <!-- Dome Inner Gold Accent Arch -->
  <path
    d="M 256 144 C 220 144 192 179 192 232 L 320 232 C 320 179 292 144 256 144 Z"
    stroke="#F4B942"
    stroke-width="12.5"
    stroke-dasharray="19 19"
    fill="none"
  />

  <!-- 4. Left Minaret -->
  <!-- Gold spire & pinnacle -->
  <path d="M 88 136 L 104 112 L 120 136 L 120 296 L 88 296 Z" fill="#F4B942" />
  <!-- Lower minaret tower -->
  <rect x="72" y="296" width="64" height="128" fill="#006C4E" stroke="#00B686" stroke-width="6"/>
  <!-- Minaret arched window slit -->
  <rect x="88" y="320" width="32" height="48" rx="8" fill="#042C20" />

  <!-- 5. Right Minaret -->
  <!-- Gold spire & pinnacle -->
  <path d="M 392 136 L 408 112 L 424 136 L 424 296 L 392 296 Z" fill="#F4B942" />
  <!-- Lower minaret tower -->
  <rect x="376" y="296" width="64" height="128" fill="#006C4E" stroke="#00B686" stroke-width="6"/>
  <!-- Minaret arched window slit -->
  <rect x="392" y="320" width="32" height="48" rx="8" fill="#042C20" />

  <!-- 6. Main Building Base -->
  <rect x="136" y="232" width="240" height="192" fill="url(#base-grad)" stroke="#00B686" stroke-width="6"/>

  <!-- 7. Central Gate / Mihrab Arch -->
  <path
    d="M 216 424 L 216 328 C 216 306 234 288 256 288 C 278 288 296 306 296 328 L 296 424 Z"
    fill="#031F17"
    stroke="#F4B942"
    stroke-width="12"
  />

  <!-- 8. Side Arches -->
  <!-- Left side window -->
  <path
    d="M 160 424 L 160 352 C 160 339 171 328 184 328 L 184 424 Z"
    fill="#031F17"
  />
  <!-- Right side window -->
  <path
    d="M 328 424 L 328 328 C 341 328 352 339 352 352 L 352 424 Z"
    fill="#031F17"
  />

  <!-- 9. Ground Base Line - Solid Gold #F4B942 -->
  <path d="M 48 424 L 464 424" stroke="#F4B942" stroke-width="19" stroke-linecap="round" />
</svg>`;

// Favicon SVG - Optimized 32x32 / vector viewBox
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="fav-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A878"/>
      <stop offset="100%" stop-color="#044734"/>
    </linearGradient>
    <linearGradient id="fav-dome" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#00E6A8"/>
      <stop offset="100%" stop-color="#008761"/>
    </linearGradient>
  </defs>
  <!-- Background rounded squircle -->
  <rect width="32" height="32" rx="7.5" fill="url(#fav-bg)"/>
  
  <!-- Crescent & Star -->
  <path d="M16 3C16.8 3 17.5 3.3 18 3.8C17.2 4 16.6 4.7 16.6 5.5C16.6 6.3 17.2 7 18 7.2C17.5 7.7 16.8 8 16 8C14.6 8 13.5 6.9 13.5 5.5C13.5 4.1 14.6 3 16 3Z" fill="#F4B942"/>
  <circle cx="17.8" cy="5.2" r="0.6" fill="#F4B942"/>
  
  <!-- Dome -->
  <path d="M16 8C12.5 8 10 11 10 15H22C22 11 19.5 8 16 8Z" fill="url(#fav-dome)"/>
  <path d="M16 9.5C13.8 9.5 12 11.7 12 15H20C20 11.7 18.2 9.5 16 9.5Z" stroke="#F4B942" stroke-width="0.8" stroke-dasharray="1.2 1.2" fill="none"/>
  
  <!-- Minarets -->
  <path d="M5.5 8.5L6.5 7L7.5 8.5V19H5.5V8.5Z" fill="#F4B942"/>
  <path d="M4.5 19H8.5V26.5H4.5V19Z" fill="#006C4E"/>
  <path d="M24.5 8.5L25.5 7L26.5 8.5V19H24.5V8.5Z" fill="#F4B942"/>
  <path d="M23.5 19H27.5V26.5H23.5V19Z" fill="#006C4E"/>
  
  <!-- Main building -->
  <path d="M8.5 15H23.5V26.5H8.5V15Z" fill="#008761"/>
  
  <!-- Central Arch / Mihrab -->
  <path d="M13.5 26.5V20.5C13.5 19.1 14.6 18 16 18C17.4 18 18.5 19.1 18.5 20.5V26.5H13.5Z" fill="#031F17" stroke="#F4B942" stroke-width="0.8"/>
  
  <!-- Side arches -->
  <path d="M10 26.5V22C10 21.2 10.7 20.5 11.5 20.5V26.5H10Z" fill="#031F17"/>
  <path d="M20.5 26.5V20.5C21.3 20.5 22 22 22 22V26.5H20.5Z" fill="#031F17"/>
  
  <!-- Base line -->
  <path d="M3 26.5H29" stroke="#F4B942" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

async function main() {
  const publicDir = path.resolve('public');
  const assetsDir = path.resolve('public/assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 1. Write the vector SVG files
  fs.writeFileSync(path.join(publicDir, 'logo-simka.svg'), simkaMosqueLogoSvg);
  fs.writeFileSync(path.join(assetsDir, 'logo-simka.svg'), simkaMosqueLogoSvg);
  fs.writeFileSync(path.join(publicDir, 'favicon-simka.svg'), faviconSvg);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

  // 2. Render High-Resolution PNG (512x512)
  const resvg512 = new Resvg(simkaMosqueLogoSvg, {
    fitTo: { mode: 'width', value: 512 }
  });
  const png512 = resvg512.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'logo-simka.png'), png512);
  fs.writeFileSync(path.join(assetsDir, 'logo-simka.png'), png512);

  // 3. Render 120x120 PNG for exact login desktop size
  const resvg120 = new Resvg(simkaMosqueLogoSvg, {
    fitTo: { mode: 'width', value: 120 }
  });
  const png120 = resvg120.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'logo-simka-120.png'), png120);

  // 4. Render Favicons (32x32 & 16x16)
  const resvg32 = new Resvg(faviconSvg, {
    fitTo: { mode: 'width', value: 32 }
  });
  const png32 = resvg32.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'favicon-simka-32x32.png'), png32);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), png32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);

  const resvg16 = new Resvg(faviconSvg, {
    fitTo: { mode: 'width', value: 16 }
  });
  const png16 = resvg16.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'favicon-simka-16x16.png'), png16);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), png16);

  // 5. Render Apple Touch Icon (180x180)
  const resvg180 = new Resvg(simkaMosqueLogoSvg, {
    fitTo: { mode: 'width', value: 180 }
  });
  const png180 = resvg180.render().asPng();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-simka.png'), png180);

  console.log('✅ Generated all SIMKA Mosque Logo & Favicon assets successfully:');
  console.log('- public/logo-simka.png (512x512)');
  console.log('- public/logo-simka.svg');
  console.log('- public/logo-simka-120.png (120x120)');
  console.log('- public/favicon-simka.svg & public/favicon.svg');
  console.log('- public/favicon-simka-32x32.png & public/favicon-32x32.png');
  console.log('- public/favicon-simka-16x16.png & public/favicon-16x16.png');
  console.log('- public/apple-touch-icon.png (180x180)');
}

main().catch(console.error);
