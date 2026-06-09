// 브랜디드 QR 생성기 (1회성·재실행 가능). ksaju.me는 고정 URL이라
// 산출물 public/ksaju-qr.png 한 장만 커밋 → 런타임 의존성 0.
// URL이나 낙관이 바뀌면 `npm run gen:qr` 재실행 후 산출물 재커밋.
import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";

const URL = "https://ksaju.me";
const SIZE = 900; // QR 한 변(px)
const OUT = path.resolve("public/ksaju-qr.png");
const STAMP = path.resolve("scripts/assets/stamp-saju.png");

async function main() {
  // 1) QR (에러정정 H → 중앙 로고 가림 허용). 모듈=묵, 배경=흰색.
  const qr = await QRCode.toBuffer(URL, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: SIZE,
    color: { dark: "#1A1A2E", light: "#FFFFFF" },
  });

  // 2) 낙관: 우하단 메이커 워터마크를 센터-크롭으로 떨궈낸 뒤 로고 크기로 리사이즈.
  //    (도장은 중앙 ~75%에 있고 워터마크는 코너 여백에 있으므로 84% 센터-크롭이면 제거됨.)
  const meta = await sharp(STAMP).metadata();
  const side = Math.min(meta.width, meta.height);
  const crop = Math.round(side * 0.84);
  const logo = Math.round(SIZE * 0.2); // ~180px (~20% — 레벨 H 허용 범위)
  const stamp = await sharp(STAMP)
    .extract({
      left: Math.round((meta.width - crop) / 2),
      top: Math.round((meta.height - crop) / 2),
      width: crop,
      height: crop,
    })
    .resize(logo, logo, { fit: "contain", background: "#FFFFFF" })
    .toBuffer();

  // 3) 로고 뒤 흰 둥근 패치(스캔 quiet-zone).
  const pad = Math.round(logo * 0.16);
  const patchSize = logo + pad * 2;
  const r = Math.round(patchSize * 0.16);
  const patchBg = Buffer.from(
    `<svg width="${patchSize}" height="${patchSize}">` +
      `<rect width="${patchSize}" height="${patchSize}" rx="${r}" ry="${r}" fill="#FFFFFF"/>` +
      `</svg>`,
  );
  const patch = await sharp(patchBg)
    .composite([{ input: stamp, gravity: "center" }])
    .png()
    .toBuffer();

  // 4) QR 중앙에 패치 합성 → 출력.
  await sharp(qr)
    .composite([{ input: patch, gravity: "center" }])
    .png()
    .toFile(OUT);

  console.log(`✓ wrote ${OUT} (${SIZE}x${SIZE}, QR -> ${URL})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
