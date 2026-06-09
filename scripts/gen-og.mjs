/**
 * OG 이미지 생성기 — 1200×630 한지 미감 PNG
 * 용도: public/og-default.png (소셜 공유 미리보기)
 * 실행: npm run gen:og
 * 의존성: sharp (devDependency, 이미 설치됨)
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public", "og-default.png");

const W = 1200;
const H = 630;

// 팔레트 (한지 라이트 테마)
const HANJI   = "#FBF6E8";
const INK     = "#1A1A2E";
const PRIMARY = "#C8385A";  // 진달래 핑크
const ACCENT  = "#C49A3F";  // 단청황 골드
const MUTED   = "#6B6B8A";

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 창살 격자 패턴 -->
    <pattern id="changsal" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
      <line x1="30" y1="0" x2="30" y2="60" stroke="${INK}" stroke-width="0.5" opacity="0.06"/>
      <line x1="0" y1="30" x2="60" y2="30" stroke="${INK}" stroke-width="0.5" opacity="0.06"/>
    </pattern>
    <!-- 한지 노이즈 필터 -->
    <filter id="paper" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="matrix"
        values="0 0 0 0 0.98  0 0 0 0 0.96  0 0 0 0 0.91  0 0 0 0.18 0" result="tinted"/>
      <feComposite in="tinted" in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="${W}" height="${H}" fill="${HANJI}"/>
  <!-- 한지 텍스처 -->
  <rect width="${W}" height="${H}" fill="${HANJI}" filter="url(#paper)"/>
  <!-- 창살 격자 -->
  <rect width="${W}" height="${H}" fill="url(#changsal)"/>

  <!-- 좌측 진달래 수직 바 -->
  <rect x="0" y="0" width="10" height="${H}" fill="${PRIMARY}"/>

  <!-- 상·하단 단청황 라인 -->
  <rect x="0" y="0" width="${W}" height="5" fill="${ACCENT}"/>
  <rect x="0" y="${H - 5}" width="${W}" height="5" fill="${ACCENT}"/>

  <!-- 우측 낙관(도장) 원형 데코 -->
  <circle cx="1070" cy="190" r="145" fill="none" stroke="${PRIMARY}" stroke-width="1.5" opacity="0.13"/>
  <circle cx="1070" cy="190" r="122" fill="none" stroke="${PRIMARY}" stroke-width="1" opacity="0.09"/>
  <circle cx="1070" cy="190" r="100" fill="${PRIMARY}" opacity="0.04"/>

  <!-- 배경 워터마크 한자 四柱 -->
  <text x="1070" y="520"
    font-family="'Malgun Gothic', 'Noto Serif KR', 'Source Han Serif', serif"
    font-size="340" font-weight="700"
    fill="${INK}" opacity="0.04"
    text-anchor="middle">四柱</text>

  <!-- KSaju 로고 워드마크 -->
  <text x="80" y="250"
    font-family="Arial Black, 'Arial Bold', Arial, sans-serif"
    font-size="124" font-weight="900"
    fill="${INK}" letter-spacing="-4">KSaju</text>

  <!-- 四柱 한자 + 설명 -->
  <text x="86" y="296"
    font-family="'Malgun Gothic', 'Noto Serif KR', serif"
    font-size="26" font-weight="400"
    fill="${ACCENT}" letter-spacing="4">四柱 · Korean Fortune Telling</text>

  <!-- 구분선 -->
  <line x1="80" y1="336" x2="700" y2="336" stroke="${PRIMARY}" stroke-width="1.5" opacity="0.45"/>
  <circle cx="80" cy="336" r="5" fill="${ACCENT}"/>
  <circle cx="700" cy="336" r="3" fill="${PRIMARY}" opacity="0.5"/>

  <!-- 태그라인 -->
  <text x="80" y="418"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="56" font-weight="700"
    fill="${INK}">"Saju, but make it K."</text>

  <!-- 부제 -->
  <text x="80" y="478"
    font-family="Arial, 'Helvetica Neue', sans-serif"
    font-size="27" font-weight="400"
    fill="${MUTED}">K-pop compatibility · launching at ksaju.me</text>

  <!-- URL 뱃지 -->
  <rect x="80" y="516" width="272" height="54" rx="27" fill="${PRIMARY}" opacity="0.1"/>
  <rect x="80" y="516" width="272" height="54" rx="27" fill="none" stroke="${PRIMARY}" stroke-width="1.5" opacity="0.35"/>
  <text x="216" y="550"
    font-family="Arial, 'Helvetica Neue', sans-serif"
    font-size="22" font-weight="700"
    fill="${PRIMARY}" text-anchor="middle">ksaju.me →</text>

  <!-- 우하단 데코 닷 -->
  <circle cx="1140" cy="590" r="8" fill="${ACCENT}" opacity="0.45"/>
  <circle cx="1162" cy="568" r="5" fill="${PRIMARY}" opacity="0.4"/>
  <circle cx="1118" cy="574" r="4" fill="${ACCENT}" opacity="0.3"/>
  <circle cx="1148" cy="550" r="3" fill="${PRIMARY}" opacity="0.25"/>
</svg>`;

async function main() {
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  const fs = await import("node:fs/promises");
  const { size } = await fs.stat(OUT);
  console.log(`✓ wrote ${OUT} (${W}×${H}, ${(size / 1024).toFixed(0)}KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
