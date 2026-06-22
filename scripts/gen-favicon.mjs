// 파비콘 생성기 (1회성·재실행 가능). 사주 낙관(scripts/assets/stamp-saju.png)을
// 흰 배경 위에 올려 브라우저 탭 아이콘으로 만든다. 산출물만 커밋 → 런타임 의존성 0.
// 낙관이 바뀌면 `npm run gen:favicon` 재실행 후 산출물 재커밋.
//
// 산출물:
//   src/app/favicon.ico      — 16/32/48 멀티해상도(흰 배경, 브라우저 탭)
//   public/apple-touch-icon.png — 180×180(흰 배경, iOS 홈화면 / metadata icons.apple)
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const STAMP = join(root, "scripts", "assets", "stamp-saju.png");
const ICO_OUT = join(root, "src", "app", "favicon.ico");
const APPLE_OUT = join(root, "public", "apple-touch-icon.png");

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const PAD = 0.9; // 낙관이 캔버스의 90% 차지(나머지 흰 여백)

// 흰 배경 size×size PNG 버퍼 생성. 낙관은 우하단 메이커 워터마크를
// 84% 센터-크롭으로 떨궈낸 뒤(gen-qr와 동일) 투명 여백 트림 → 중앙 배치.
async function renderIcon(size) {
  const meta = await sharp(STAMP).metadata();
  const side = Math.min(meta.width, meta.height);
  const crop = Math.round(side * 0.84);
  const left = Math.round((meta.width - crop) / 2);
  const top = Math.round((meta.height - crop) / 2);

  // extract → trim 은 한 파이프라인에서 충돌하므로 단계 분리.
  const cropped = await sharp(STAMP)
    .extract({ left, top, width: crop, height: crop })
    .toBuffer();

  const inner = Math.round(size * PAD);
  const stamp = await sharp(cropped)
    .trim() // 낙관 둘레 투명 여백 제거 → 도장이 꽉 차게
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: stamp, gravity: "center" }])
    .png()
    .toBuffer();
}

// PNG 버퍼 배열 → ICO 컨테이너(PNG-in-ICO, 모던 브라우저 전 지원).
function packIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const parts = [];
  images.forEach((img, i) => {
    const b = i * 16;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0); // width
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, b + 8); // byte size
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += img.data.length;
    parts.push(img.data);
  });

  return Buffer.concat([header, dir, ...parts]);
}

async function main() {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map(async (size) => ({ size, data: await renderIcon(size) })),
  );
  writeFileSync(ICO_OUT, packIco(pngs));
  console.log(`✓ ${ICO_OUT} (${sizes.join("/")} px)`);

  const apple = await renderIcon(180);
  writeFileSync(APPLE_OUT, apple);
  console.log(`✓ ${APPLE_OUT} (180px)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
