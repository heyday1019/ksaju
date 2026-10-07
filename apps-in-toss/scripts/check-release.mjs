/**
 * 출시 빌드 검사 — 출시 빌드 스크립트가 vite build 직후·ait build 직전에 돌린다. 실패하면 멈춘다.
 *
 *   node scripts/check-release.mjs                  dist/ 를 검사
 *   node scripts/check-release.mjs --mode miniapp   .env.miniapp 의 실 ID 도 필수로 본다
 *   node scripts/check-release.mjs --ait app.ait    이미 만든 .ait 를 검사(빌드 없이)
 *
 * 왜: 앱인토스 검수는 번들의 **문자열**을 본다. 런타임에 안 쓰는 상수여도 테스트 광고 ID 가
 * 남아 있으면 반려다 — "출시할 미니앱 번들에는 테스트용 광고 그룹 ID를 넣을 수 없어요"
 * (스트레스 팡팡 20261007-12, 걱정인형 우체통 2026-08-21 반려).
 *
 * 확인하는 것:
 *   1. 테스트 광고 그룹 ID(`ait-ad-test-…`) 0개
 *   2. 테스트 프로모션 코드(`TEST_` + 코드) 0개
 *   3. src/ 와 .env 파일에 적힌 실 광고 그룹 ID(`ait.v2.live.…`)가 번들에 전부 있다
 *      (테스트 플래그를 켠 채 빌드하면 실 ID 가 빠진다 — 그것도 잡는다)
 *
 * 2026-10-07 스트레스 팡팡 `tools/check-release.mjs` 를 일반화해 각 미니앱에 넣었다.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const mode = opt('--mode');
const aitPath = opt('--ait');
const distDir = resolve(ROOT, opt('--dist') ?? 'dist');

const TEXT = /\.(js|mjs|cjs|html|css|json)$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'node_modules') walk(full, out);
    } else out.push(full);
  }
  return out;
}

/** .ait(zip) 안의 텍스트 파일을 읽는다. 외부 의존성 없이 zip 중앙 디렉터리를 직접 읽는다. */
function readAit(file) {
  const buf = readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error(`zip 이 아니다: ${file}`);
  const count = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  // .ait 는 zip 앞에 머리 데이터가 붙어 있다. zip 안의 오프셋은 zip 시작 기준이라 그만큼 민다.
  const shift = eocd - (cdOffset + cdSize);
  let p = cdOffset + shift;
  const parts = [];
  for (let i = 0; i < count; i += 1) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42) + shift;
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (TEXT.test(name)) {
      const lNameLen = buf.readUInt16LE(local + 26);
      const lExtraLen = buf.readUInt16LE(local + 28);
      const start = local + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + size);
      parts.push((method === 8 ? inflateRawSync(raw) : raw).toString('utf8'));
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return parts.join('\n');
}

function readBundle() {
  if (aitPath !== undefined) return readAit(resolve(ROOT, aitPath));
  if (!existsSync(distDir)) throw new Error(`${distDir} 가 없다 — 빌드 뒤에 돌린다`);
  return walk(distDir)
    .filter((f) => TEXT.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

/** 이 번들에 들어 있어야 할 실 광고 그룹 ID. src/ 와 출시 빌드가 읽는 .env 파일에서 모은다. */
function expectedLiveIds() {
  const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
  if (mode !== undefined) envFiles.push(`.env.${mode}`, `.env.${mode}.local`);
  const files = [
    ...(existsSync(join(ROOT, 'src')) ? walk(join(ROOT, 'src')) : []),
    ...envFiles.map((f) => join(ROOT, f)).filter(existsSync),
  ];
  const ids = new Set();
  for (const f of files) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(f) && !/[\\/]\.env/.test(f)) continue;
    for (const id of readFileSync(f, 'utf8').match(/ait\.v2\.live\.[0-9a-f]{8,}/g) ?? []) ids.add(id);
  }
  return [...ids];
}

const bundle = readBundle();
const problems = [];

const testIds = [...new Set(bundle.match(/ait-ad-test-[a-z-]+/g) ?? [])];
if (testIds.length > 0) problems.push(`테스트 광고 그룹 ID 가 들어 있다: ${testIds.join(', ')}`);

const testPromos = [...new Set(bundle.match(/TEST_[0-9A-Z]{20,}/g) ?? [])];
if (testPromos.length > 0) {
  problems.push(`테스트 프로모션 코드가 들어 있다: ${testPromos.map((c) => `${c.slice(0, 9)}…`).join(', ')}`);
}

const live = expectedLiveIds();
const missing = live.filter((id) => !bundle.includes(id));
if (missing.length > 0) {
  problems.push(`실 광고 그룹 ID 가 빠졌다: ${missing.map((id) => `…${id.slice(-8)}`).join(', ')}`);
}

const target = aitPath ?? (opt('--dist') ?? 'dist');
if (problems.length > 0) {
  console.error(`\n출시 빌드 검사 실패 (${target}) — 출시 번들로 쓰면 안 된다`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `출시 빌드 검사 통과 (${target}) — 테스트 광고 ID 0개, TEST_ 프로모션 0개, 실 광고 ID ${live.length}개 모두 있음`,
);
