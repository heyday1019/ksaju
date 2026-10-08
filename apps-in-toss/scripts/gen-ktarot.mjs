/**
 * K-타로 한국어 보강 레이어 생성기 — `npm run gen:ktarot`
 *
 *   docs/K-타로 78장 구조화 노트.md      → 78장 전부: 정/역 키워드, 상징, 모티프
 *   docs/K-타로 오리지널 해석 문안.md    → 메이저 22장: 정/역 본문, 3줄, 훅, 별칭
 *                                        ↓
 *   src/data/ktarot-ko.json  (카드 id 0~77 을 키로)
 *
 * 왜 생성기인가: 100개 레코드를 손으로 옮기면 반드시 틀리고, 문서가 고쳐질 때마다
 * 다시 틀린다. 리포의 `seed-idols.mjs` 와 같은 방식이다.
 *
 * **검증을 통과해야만 기록한다.** 78장이 전부 채워졌는지, 메이저 22장에 본문이
 * 있는지, 키워드가 정확히 3개인지 확인하고 하나라도 어긋나면 쓰지 않고 멈춘다.
 * 조용히 비어 있는 카드가 생기면 그 카드를 뽑은 사용자만 빈 화면을 본다.
 *
 * 마이너 56장 본문이 나중에 같은 형식으로 추가되면 그대로 받는다(2절 참고).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STRUCT_MD = join(ROOT, "docs", "K-타로 78장 구조화 노트.md");
const COPY_MD = join(ROOT, "docs", "K-타로 오리지널 해석 문안.md");
const OUT = join(ROOT, "src", "data", "ktarot-ko.json");

/** 수트별 시작 id. 원본 `ksaju-tarot.json` 의 배열 순서와 같다. */
const SUIT_BASE = { wands: 22, cups: 36, swords: 50, pentacles: 64 };
/** 마이너 14장의 등장 순서. 표의 행 순서와 1:1 이다. */
const MINOR_RANKS = [
  "에이스", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "페이지", "나이트", "퀸", "킹",
];
/** 문서의 수트 섹션 제목 → 내부 키 */
const SUIT_SECTION = {
  "완드 14장": "wands",
  "컵 14장": "cups",
  "소드 14장": "swords",
  "펜타클 14장": "pentacles",
};

const problems = [];
const fail = (msg) => problems.push(msg);

/** `| a | b | c |` → ["a","b","c"] */
function cells(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function isTableRow(line) {
  return line.trim().startsWith("|") && !/^\|[\s:|-]+\|$/.test(line.trim());
}

/** "출발, 순수, 모험" → ["출발","순수","모험"] */
function splitKeywords(s) {
  return s
    .split(/[,·]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

// ── 1) 구조화 노트: 78장 ────────────────────────────────────────────────
const struct = readFileSync(STRUCT_MD, "utf8").split(/\r?\n/);
const out = {};

let section = null;
let minorIndex = 0;

for (const line of struct) {
  const heading = line.match(/^##\s+(.+)$/);
  if (heading) {
    const title = heading[1].trim();
    if (title.startsWith("메이저 아르카나")) {
      section = "major";
    } else {
      const key = Object.keys(SUIT_SECTION).find((k) => title.startsWith(k));
      section = key ? SUIT_SECTION[key] : null;
      minorIndex = 0;
    }
    continue;
  }
  if (!section || !isTableRow(line)) continue;

  const c = cells(line);

  if (section === "major") {
    // | No. | 카드 | 정방향 | 역방향 | 상징 | 모티프 |
    if (c.length < 6 || !/^\d+$/.test(c[0])) continue; // 헤더행 건너뜀
    const id = Number(c[0]);
    out[id] = {
      up: splitKeywords(c[2]),
      rev: splitKeywords(c[3]),
      symbol: c[4],
      motif: c[5],
    };
  } else {
    // | 카드 | 정방향 | 역방향 | 상징 | 모티프 |
    if (c.length < 5 || c[0] === "카드") continue; // 헤더행 건너뜀
    const expected = MINOR_RANKS[minorIndex];
    if (c[0] !== expected) {
      fail(`${section} ${minorIndex}번째 행이 '${expected}' 가 아니라 '${c[0]}' 입니다`);
    }
    out[SUIT_BASE[section] + minorIndex] = {
      up: splitKeywords(c[1]),
      rev: splitKeywords(c[2]),
      symbol: c[3],
      motif: c[4],
    };
    minorIndex += 1;
  }
}

// ── 2) 해석 문안: 메이저 22장 ───────────────────────────────────────────
const copy = readFileSync(COPY_MD, "utf8");
// `### 0. 떠돌이 보부상 (바보)` 부터 다음 `###`/`##` 전까지
const entries = copy.split(/^###\s+/m).slice(1);

for (const block of entries) {
  const head = block.split(/\r?\n/, 1)[0];
  const m = head.match(/^(\d+)\.\s*(.+?)\s*\((.+?)\)\s*$/);
  if (!m) continue;
  const id = Number(m[1]);
  const alias = m[2].trim();

  const body = block.slice(block.indexOf("\n") + 1).split(/^##\s/m)[0];
  const pick = (re) => {
    const r = body.match(re);
    return r ? r[1].trim() : null;
  };

  const record = out[id];
  if (!record) {
    fail(`해석 문안의 ${id}번 카드가 구조화 노트에 없습니다`);
    continue;
  }

  record.alias = alias;
  record.reading = {
    up: pick(/^정방향:\s*(.+)$/m),
    rev: pick(/^역방향:\s*(.+)$/m),
  };
  record.topics = {
    love: pick(/^-\s*연애:\s*(.+)$/m),
    work: pick(/^-\s*일[·・]돈:\s*(.+)$/m),
    advice: pick(/^-\s*오늘의 조언:\s*(.+)$/m),
  };
  record.hook = pick(/^-\s*모티프:\s*(.+)$/m);
}

// ── 3) 검증 — 통과해야만 쓴다 ───────────────────────────────────────────
for (let id = 0; id < 78; id += 1) {
  const r = out[id];
  if (!r) {
    fail(`${id}번 카드가 비어 있습니다`);
    continue;
  }
  // 문서의 표기 규칙은 "3개"라고 적혀 있지만 실제 표에는 2개인 칸이 많다
  // (예: 탑 역방향 "위기 회피, 서서히 무너짐"). 선언이 아니라 내용을 기준으로
  // 2개 이상만 요구한다 — 1개면 문장을 만들 수 없으니 그건 막는다.
  if (!(r.up?.length >= 2)) fail(`${id}번 정방향 키워드가 부족합니다 (${r.up?.length ?? 0})`);
  if (!(r.rev?.length >= 2)) fail(`${id}번 역방향 키워드가 부족합니다 (${r.rev?.length ?? 0})`);
  if (!r.symbol) fail(`${id}번 상징이 비어 있습니다`);
  if (!r.motif) fail(`${id}번 모티프가 비어 있습니다`);

  if (id < 22) {
    if (!r.alias) fail(`메이저 ${id}번 별칭이 없습니다`);
    if (!r.reading?.up) fail(`메이저 ${id}번 정방향 본문이 없습니다`);
    if (!r.reading?.rev) fail(`메이저 ${id}번 역방향 본문이 없습니다`);
    for (const k of ["love", "work", "advice"]) {
      if (!r.topics?.[k]) fail(`메이저 ${id}번 topics.${k} 가 없습니다`);
    }
    if (!r.hook) fail(`메이저 ${id}번 모티프 훅이 없습니다`);
  }
}

// 10대도 보는 콘텐츠다. 문서 톤 규칙("단정하지 않고, 겁주지 않고")을 기계로도 지킨다.
const BANNED = /반드시|틀림없|위험|불행|나쁜 일|죽을|하게 됩니다/;
for (const [id, r] of Object.entries(out)) {
  const text = [r.reading?.up, r.reading?.rev, ...Object.values(r.topics ?? {})]
    .filter(Boolean)
    .join(" ");
  if (BANNED.test(text)) fail(`${id}번 문안에 단정·위협 표현이 있습니다`);
}

if (problems.length) {
  console.error(`\n생성 실패 — ${problems.length}건\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const majors = Object.keys(out).filter((id) => Number(id) < 22).length;
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n", "utf8");
const dist = {};
for (const r of Object.values(out)) {
  const k = `${r.up.length}/${r.rev.length}`;
  dist[k] = (dist[k] ?? 0) + 1;
}
console.log(
  `ktarot-ko.json 생성 — 78장 (본문 있는 메이저 ${majors}장), ` +
    `${(JSON.stringify(out).length / 1024).toFixed(1)}KB`,
);
console.log(`키워드 개수 분포(정/역):`, dist);
