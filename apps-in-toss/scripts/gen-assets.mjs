// ============================================================
// 미니앱 디자인 자산 1회용 생성기 (scripts/seed-idols.mjs · gen-qr.mjs 패턴)
//
//   node scripts/gen-assets.mjs
//
// 산출물은 커밋되며, 런타임/빌드는 커밋된 파일만 참조한다(런타임 의존성 0).
// src/assets 에 두는 이유: base:"./" 에서 public/ 의 절대 url() 은 재작성되지 않아 깨진다.
//   src/assets/hanji-bg.webp  ← 메인 레포 public/hanji-bg.png (426KB → ~16KB)
//   src/assets/stamp.webp     ← public/app-icon-600.png 을 160px 로 (~5KB)
//   src/assets/hanja.woff2    ← Noto Serif KR 에서 한자 43글리프만 서브셋 (~10KB)
//
// 타로 덱은 여기서 만들지 않는다 — 번들에 싣지 않고 ksaju.me 에서 받아온다.
// (메인 레포 public/tarot-webp/, 최초 접속 시간에 얹히지 않게)
//
// 필요 도구(개발 머신에만):
//   - sharp        : 메인 레포 루트 node_modules 에서 해석한다
//   - fonttools    : python -m pip install fonttools brotli
// ============================================================
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const repo = resolve(app, "..");

// sharp 는 미니앱의 의존성이 아니다 — 메인 레포 루트에서 빌려 쓴다.
const require = createRequire(join(repo, "package.json"));
const sharp = require("sharp");

/** 한지 텍스처: 원본 해상도 유지, WebP 로만 압축 (타일링이라 크기를 줄이면 패턴이 깨진다) */
async function hanjiTexture() {
  const src = join(repo, "public", "hanji-bg.png");
  const out = join(app, "src", "assets", "hanji-bg.webp");
  await sharp(src).webp({ quality: 80 }).toFile(out);
  return out;
}

/** 인트로에 얹는 낙관(四柱 도장) 마크. 콘솔 아이콘과 같은 원본에서 작게 뽑는다. */
async function stampMark() {
  const src = join(app, "public", "app-icon-600.png");
  const out = join(app, "src", "assets", "stamp.webp");
  await sharp(src).resize(160, 160).webp({ quality: 85 }).toFile(out);
  return out;
}

/**
 * 한자 서브셋 폰트.
 * Gowun Batang 은 한글 전용이라 한자 글리프가 없다 — 웹앱에서도 한자는
 * Noto Serif KR 이 그린다. 그래서 서브셋 원본은 Noto Serif KR 이다.
 * variable(wght) 폰트라 파일 하나로 400·700 을 모두 낸다.
 */
const CODEPOINTS = [
  // 천간 10
  "U+7532", "U+4E59", "U+4E19", "U+4E01", "U+620A",
  "U+5DF1", "U+5E9A", "U+8F9B", "U+58EC", "U+7678",
  // 지지 12
  "U+5B50", "U+4E11", "U+5BC5", "U+536F", "U+8FB0", "U+5DF3",
  "U+5348", "U+672A", "U+7533", "U+9149", "U+620C", "U+4EA5",
  // 오행 5 + 로고/장식 한자
  "U+6728", "U+706B", "U+571F", "U+91D1", "U+6C34", "U+4E95", "U+56DB", "U+67F1",
  // 점수·곱셈 기호
  "U+00D7", "U+0030-0039", "U+002F",
].join(",");

const NOTO_URL =
  "https://github.com/google/fonts/raw/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf";

async function hanjaFont() {
  const tmp = join(app, "node_modules", ".cache", "NotoSerifKR.ttf");
  mkdirSync(dirname(tmp), { recursive: true });
  if (!existsSync(tmp)) {
    const res = await fetch(NOTO_URL);
    if (!res.ok) throw new Error(`Noto Serif KR 내려받기 실패: ${res.status}`);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  }
  const out = join(app, "src", "assets", "hanja.woff2");
  mkdirSync(dirname(out), { recursive: true });
  execFileSync("python", [
    "-m", "fontTools.subset", tmp,
    `--unicodes=${CODEPOINTS}`,
    "--flavor=woff2",
    "--layout-features=",
    "--no-hinting",
    `--output-file=${out}`,
  ], { stdio: "inherit" });
  return out;
}

const human = (n) => `${(n / 1024).toFixed(1)} KB`;

for (const make of [hanjiTexture, stampMark, hanjaFont]) {
  const r = await make();
  const label = typeof r === "string" ? r.replace(app + "\\", "").replace(app + "/", "") : r.label;
  const size = typeof r === "string" ? statSync(r).size : r.size;
  console.log(`✓ ${label}  ${human(size)}`);
}
