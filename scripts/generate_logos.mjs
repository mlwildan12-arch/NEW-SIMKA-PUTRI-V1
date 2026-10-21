import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

// 1. Logo 2: Compact Square Nuris Emblem ("LOGO NURIS KOTAK tanpa tulisan")
const logoNurisKotakSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <!-- Top Orange Diamond Dots -->
  <g fill="#EA8928">
    <!-- Topmost small diamond dot -->
    <polygon points="256,40 278,72 256,104 234,72" />
    <!-- Second small diamond dot -->
    <polygon points="256,92 284,130 256,168 228,130" />
    <!-- Central Orange Chevron (V) -->
    <path d="M 256 288 L 152 152 L 206 152 L 256 218 L 306 152 L 360 152 Z" />
  </g>

  <!-- Green Kufic Geometric Emblem (#107C41) -->
  <g fill="#107C41">
    <!-- Outer Diamond & Interlocking Geometric Arms -->
    <!-- Left outer wing -->
    <path d="M 120 220 L 22 318 L 68 364 L 118 314 L 176 372 L 130 418 L 84 372 L 38 418 L 120 500 L 220 400 L 150 330 L 180 300 L 220 340 L 220 220 Z" />
    
    <!-- Right outer wing -->
    <path d="M 392 220 L 490 318 L 444 364 L 394 314 L 336 372 L 382 418 L 428 372 L 474 418 L 392 500 L 292 400 L 362 330 L 332 300 L 292 340 L 292 220 Z" />

    <!-- Bottom Center Heart V Interlock -->
    <path d="M 256 480 L 140 364 L 182 322 L 256 396 L 330 322 L 372 364 Z" />

    <!-- Left inner green diamond dot -->
    <polygon points="310,310 332,332 310,354 288,332" />
    <!-- Right inner green diamond dot -->
    <polygon points="202,310 224,332 202,354 180,332" />
  </g>
</svg>`;

// Better refined pixel-perfect Nuris Emblem SVG that matches the uploaded image precisely
const refinedNurisEmblem = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" fill="none">
  <!-- Orange geometric accents -->
  <g fill="#EA8A28">
    <!-- Top diamond dot 1 -->
    <rect x="187" y="15" width="26" height="26" transform="rotate(45 200 28)" rx="2" />
    <!-- Top diamond dot 2 -->
    <rect x="182" y="55" width="36" height="36" transform="rotate(45 200 73)" rx="3" />
    <!-- Center Chevron V -->
    <path d="M 120 115 L 200 220 L 280 115 L 244 115 L 200 174 L 156 115 Z" />
  </g>

  <!-- Green Islamic Calligraphic Geometric Frame -->
  <g fill="#0E8043">
    <!-- Left Branch -->
    <path d="M 16 195 L 75 136 L 140 201 L 108 233 L 75 200 L 48 227 L 140 319 L 200 259 L 168 227 L 200 195 L 232 227 L 200 259 L 200 384 L 16 200 Z" fill-rule="evenodd" />
    <!-- Clean mirrored geometry -->
    <!-- Main Left Wing -->
    <path d="M 16 200 L 140 76 L 175 111 L 83 203 L 138 258 L 173 223 L 200 250 L 200 384 L 16 200 Z" />
    <!-- Main Right Wing -->
    <path d="M 384 200 L 260 76 L 225 111 L 317 203 L 262 258 L 227 223 L 200 250 L 200 384 L 384 200 Z" />
    
    <!-- Central Bottom V -->
    <path d="M 200 384 L 70 254 L 105 219 L 200 314 L 295 219 L 330 254 Z" />
    
    <!-- Left Top Arm -->
    <path d="M 60 156 L 140 76 L 170 106 L 118 158 L 148 188 L 118 218 L 60 160 Z" />
    <!-- Right Top Arm -->
    <path d="M 340 156 L 260 76 L 230 106 L 282 158 L 252 188 L 282 218 L 340 160 Z" />
    
    <!-- Dots inside -->
    <rect x="235" y="225" width="28" height="28" transform="rotate(45 249 239)" rx="2" />
    <rect x="137" y="225" width="28" height="28" transform="rotate(45 151 239)" rx="2" />
  </g>
</svg>`;

// Complete Full Logo (Logo 1: "logo pesantren nurul islam tengaran")
const logoPesantrenFullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 350" width="1200" height="350" fill="none">
  <!-- Left: Emblem Icon -->
  <g transform="translate(30, 20) scale(0.78)">
    <!-- Orange accents -->
    <g fill="#EA8A28">
      <rect x="187" y="15" width="28" height="28" transform="rotate(45 201 29)" rx="2" />
      <rect x="182" y="55" width="38" height="38" transform="rotate(45 201 74)" rx="3" />
      <path d="M 115 115 L 200 226 L 285 115 L 246 115 L 200 176 L 154 115 Z" />
    </g>

    <!-- Green Islamic Geometry -->
    <g fill="#0E8043">
      <path d="M 20 200 L 140 80 L 175 115 L 85 205 L 140 260 L 175 225 L 200 250 L 200 380 L 20 200 Z" />
      <path d="M 380 200 L 260 80 L 225 115 L 315 205 L 260 260 L 225 225 L 200 250 L 200 380 L 380 200 Z" />
      <path d="M 200 380 L 70 250 L 105 215 L 200 310 L 295 215 L 330 250 Z" />
      <path d="M 60 160 L 140 80 L 170 110 L 118 162 L 148 192 L 118 222 L 60 164 Z" />
      <path d="M 340 160 L 260 80 L 230 110 L 282 162 L 252 192 L 282 222 L 340 164 Z" />
      <rect x="235" y="225" width="28" height="28" transform="rotate(45 249 239)" rx="2" />
      <rect x="137" y="225" width="28" height="28" transform="rotate(45 151 239)" rx="2" />
    </g>
  </g>

  <!-- Right: Arabic Calligraphy (معهد نور الإسلام للتربية الإسلامية) -->
  <g transform="translate(360, 30)">
    <!-- High-elegance Arabic vector typographic path representation -->
    <text x="790" y="160" text-anchor="end" font-family="'Traditional Arabic', 'Amiri', 'Scheherazade New', 'Noto Naskh Arabic', 'Geeza Pro', serif" font-size="108" font-weight="bold" fill="#0E8043" direction="rtl">
      معهد نور الإسلام للتربية الإسلامية
    </text>

    <!-- Subtitle: PESANTREN NURUL ISLAM TENGARAN -->
    <text x="10" y="248" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Montserrat', sans-serif" font-size="44" font-weight="900" fill="#EA8A28" letter-spacing="4px">
      PESANTREN NURUL ISLAM TENGARAN
    </text>
  </g>
</svg>`;

async function generate() {
  const publicDir = path.resolve('public');
  const assetsDir = path.resolve('public/assets');

  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  // 1. Write SVGs
  fs.writeFileSync(path.join(publicDir, 'logo pesantren nurul islam tengaran.svg'), logoPesantrenFullSvg);
  fs.writeFileSync(path.join(assetsDir, 'logo-pesantren-nurul-islam-tengaran.svg'), logoPesantrenFullSvg);

  fs.writeFileSync(path.join(publicDir, 'LOGO NURIS KOTAK tanpa tulisan.svg'), refinedNurisEmblem);
  fs.writeFileSync(path.join(assetsDir, 'logo-nuris-kotak.svg'), refinedNurisEmblem);

  // 2. Render PNGs using Resvg
  // Render Full Logo PNG
  const resvgFull = new Resvg(logoPesantrenFullSvg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const fullPngData = resvgFull.render().asPng();

  fs.writeFileSync(path.join(publicDir, 'logo pesantren nurul islam tengaran.png'), fullPngData);
  fs.writeFileSync(path.join(assetsDir, 'logo-pesantren-nurul-islam-tengaran.png'), fullPngData);

  // Render Square Icon PNG
  const resvgSquare = new Resvg(refinedNurisEmblem, {
    fitTo: { mode: 'width', value: 512 },
  });
  const squarePngData = resvgSquare.render().asPng();

  fs.writeFileSync(path.join(publicDir, 'LOGO NURIS KOTAK tanpa tulisan.png'), squarePngData);
  fs.writeFileSync(path.join(assetsDir, 'logo-nuris-kotak.png'), squarePngData);

  console.log('✅ Generated all logo PNG and SVG assets in /public and /public/assets');
}

generate().catch(console.error);
