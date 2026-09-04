// 한국어 카드 해설 문체 정규화: 해라체 -> 존댓말(합쇼체).
//
// `npm run draft:cards -- --lang ko` 가 만든 초안은 해라체로 나올 때가 있다.
// 사이트의 한국어 문체 기준은 손으로 쓴 the-fool — -습니다/-입니다 중심,
// 명령형은 -세요, -니까요·-이죠 같은 부드러운 어미는 그대로 둔다.
// 나머지 56장을 추가할 때 이 스크립트를 번역 직후에 한 번 돌리면 된다.
//
//   npm run fix:ko            # data/card-guides/ko.json 제자리 변환
//   npm run fix:ko -- --check # 바꿀 게 있으면 exit 1 (쓰지 않음)
//
// seed-idols 와 같은 규약: 자체 self-check 를 먼저 돌리고, 멱등이며
// (이미 존댓말이면 0곳), 변환 후 잔여 해라체가 있으면 실패로 끝낸다.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TARGET = join(root, "data", "card-guides", "ko.json");
const check = process.argv.includes("--check");

// ── 한글 음절 산술 ────────────────────────────────────────────────
const BASE = 0xac00;
const JONG_B = 17; // 종성 ㅂ
const isSyllable = (ch) => ch >= "가" && ch <= "힣";
const jong = (ch) => (ch.codePointAt(0) - BASE) % 28;
const withJong = (ch, j) =>
  String.fromCodePoint(BASE + Math.floor((ch.codePointAt(0) - BASE) / 28) * 28 + j);

/** -ㅂ니다 / -습니다 인가. '아니다'처럼 -니다로 끝나는 해라체와 반드시 구분해야 한다. */
function alreadyPolite(w) {
  return w.length >= 3 && w.endsWith("니다") && isSyllable(w[w.length - 3])
    && jong(w[w.length - 3]) === JONG_B;
}

// ── 사전 ──────────────────────────────────────────────────────────
// 명사 종결이라 손대지 않는다(문맥 확인 완료).
// '대가'·'기구가'는 명사(+주격조사)이지 의문형이 아니다. 문맥을 하나씩 열어 확인했다.
const KEEP = new Set([
  "자", "무언가", "무엇이냐고", "저승사자", "사군자",
  "대가", "기구가", "누군가", "그림자", "여행자", "관찰자",
]);

// 모음 어간의 진짜 용언. 그 외 모음 종결은 전부 명사 + 계사 축약으로 본다.
// '아니다'가 빠지면 명사 취급되어 '아니입니다'가 된다.
const VOWEL_PRED = {
  "아니다": "아닙니다", "크다": "큽니다", "다르다": "다릅니다", "기쁘다": "기쁩니다",
};

const IMPERATIVE = {
  "하라": "하세요", "마라": "마세요", "말라": "마세요", "봐라": "보세요",
  "되라": "되세요", "지라": "지세요", "들어라": "들으세요", "주어라": "주세요",
  "믿어라": "믿으세요", "부어라": "부으세요", "멈춰라": "멈추세요",
  "늦춰라": "늦추세요", "움직여라": "움직이세요", "기울여라": "기울이세요",
  "다스려라": "다스리세요", "보살펴라": "보살피세요", "지켜봐라": "지켜보세요",
  "눈여겨보라": "눈여겨보세요", "확인하라": "확인하세요", "주목하라": "주목하세요",
  "시작하라": "시작하세요", "점검하라": "점검하세요", "신뢰하라": "신뢰하세요",
  "신뢰해라": "신뢰하세요", "조정하라": "조정하세요", "전개하라": "전개하세요",
  "위임하라": "위임하세요", "행동하라": "행동하세요", "계획하라": "계획하세요",
  "연습하라": "연습하세요", "말하라": "말하세요", "들어가라": "들어가세요",
  "사용하라": "사용하세요",
  // 마이너 아르카나 56장에서 나온 것들. -어라/-아라 는 불규칙(ㄷ·ㅂ·ㅅ·르)이 섞여
  // 일반 규칙으로 못 돌린다. 하나씩 확인해 적었다.
  "내보내라": "내보내세요", "써라": "쓰세요", "받아들여라": "받아들이세요",
  "있어라": "있으세요", "보라": "보세요", "확인해라": "확인하세요",
  "쥐어라": "쥐세요", "지켜라": "지키세요", "밝혀라": "밝히세요",
  "살펴보라": "살펴보세요", "놔두어라": "놔두세요", "나아가라": "나아가세요",
  "물러나라": "물러나세요", "잡아라": "잡으세요", "이끌어라": "이끄세요",
  "움직이라": "움직이세요", "서라": "서세요", "나타나라": "나타나세요",
  "물어보라": "물어보세요", "돌아보라": "돌아보세요", "떠나라": "떠나세요",
  "묻라": "물어보세요", // 원문이 비문 — '물어라/물으라'가 맞다
  "살펴라": "살피세요", "머물러라": "머무세요", "가져라": "가지세요",
  "맡겨라": "맡기세요", "벗어라": "벗으세요", "깎아내라": "깎아내세요",
  "정직해져라": "정직해지세요", "지어라": "지으세요",
};

const QUESTION = {
  "것인가": "것인가요", "있는가": "있나요", "되었는가": "되었나요",
  "아닌가": "아닌가요", "보이는가": "보이나요", "선택인가": "선택인가요",
  "버렸는가": "버렸나요",
  // -ㄴ가 는 명사(대가·기구가·누군가)와 구분이 안 되므로 규칙화하지 않고 적어 둔다.
  "바쁜가": "바쁜가요", "두려운가": "두려운가요",
  "정체인가": "정체인가요", "위한가": "위한가요",
};

// 문맥을 직접 열어보고 정한 것들
const SPECIAL = {
  "묻자": "물어보세요",
  "느껴보자": "느껴 보세요",
  "본가": "보세요", // '무지개를 본가.' — 원문이 깨져 있던 자리
  "확인해보자": "확인해 보세요", "따르자": "따르세요",
  "물어보자": "물어보세요", "놔두자": "놔두세요",
};

// 어절 단위로 안 잡히는 명사형 명령
const PHRASE = {
  "혼동하지 말 것.": "혼동하지 마세요.",
  "강제하지 말 것.": "강제하지 마세요.",
};

/** 해라체 평서형 -다 -> 합쇼체. 바꿀 게 없으면 null. */
export function conjugate(word) {
  if (alreadyPolite(word)) return null;
  if (word.endsWith("는다")) return word.slice(0, -2) + "습니다"; // 읽는다 -> 읽습니다
  const prev = word[word.length - 2];
  if (!isSyllable(prev)) return null;
  const j = jong(prev);
  if (j === 4) return word.slice(0, -2) + withJong(prev, JONG_B) + "니다"; // 간다 -> 갑니다
  if (j === 0) {
    if (VOWEL_PRED[word]) return VOWEL_PRED[word];
    if (word.endsWith("하다")) return word.slice(0, -2) + "합니다"; // 중요하다 -> 중요합니다
    if (word.endsWith("이다")) return word.slice(0, -2) + "입니다"; // 것이다 -> 것입니다
    return word.slice(0, -1) + "입니다"; // 명사 + 계사 축약: 카드다 -> 카드입니다
  }
  return word.slice(0, -1) + "습니다"; // 있다 -> 있습니다
}

/** 어절 하나를 존댓말로. 바꿀 게 없으면 null. */
export function politen(word) {
  if (KEEP.has(word)) return null;
  const mapped = SPECIAL[word] ?? IMPERATIVE[word] ?? QUESTION[word];
  if (mapped) return mapped;
  // 규칙으로 도는 것들. 한자어+하다 계열의 명령형·청유형은 활용이 완전히 규칙적이고,
  // -는가 는 앞이 반드시 용언이라 명사와 헷갈리지 않는다.
  if (word.endsWith("하라") || word.endsWith("하자")) return word.slice(0, -2) + "하세요";
  if (word.endsWith("는가")) return word.slice(0, -2) + "나요";
  if (!word.endsWith("다")) return null;
  const out = conjugate(word);
  return out && out !== word ? out : null;
}

// 종결 문맥에 붙은 어절만 건드린다. '보다 더', '보다 큰' 같은 비교격은
// 뒤에 한글이 오므로 여기 걸리지 않는다.
const TERM = String.raw`(?=\s*(?:[.!?…:;]|—|――|['"’”)]|$))`;
const WORD = new RegExp(String.raw`[가-힣]+(?:다|라|가|자)` + TERM, "g");

function convert(text, changes) {
  let s = text;
  for (const [a, b] of Object.entries(PHRASE)) {
    if (s.includes(a)) {
      changes.push([a, b]);
      s = s.split(a).join(b);
    }
  }
  return s.replace(WORD, (w) => {
    const out = politen(w);
    if (!out) return w;
    changes.push([w, out]);
    return out;
  });
}

function walk(node, changes) {
  if (typeof node === "string") return convert(node, changes);
  if (Array.isArray(node)) return node.map((v) => walk(v, changes));
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, walk(v, changes)]));
  }
  return node;
}

// ── self-check ───────────────────────────────────────────────────
// 구현하며 실제로 밟은 지뢰들을 그대로 박아둔다.
const CASES = [
  ["아니다", "아닙니다"],   // -니다로 끝나지만 해라체. 가드가 삼키면 34곳이 조용히 누락된다.
  ["있습니다", null],       // 이미 존댓말 — 두 번 변환하면 '있습닙니다'
  ["카드다", "카드입니다"], // 명사 + 계사 — 동사로 보면 '카듭니다'
  ["도구다", "도구입니다"],
  ["중요하다", "중요합니다"],
  ["것이다", "것입니다"],
  ["있다", "있습니다"],
  ["없다", "없습니다"],
  ["간다", "갑니다"],
  ["된다", "됩니다"],
  ["만든다", "만듭니다"],
  ["읽는다", "읽습니다"],
  ["안다", "압니다"],       // 알다 — 본문 9곳 모두 '알다'임을 확인했다
  ["크다", "큽니다"],
  ["확인하라", "확인하세요"],
  ["있는가", "있나요"],
  ["무언가", null],         // 명사 '무언가' — 의문형으로 오인하면 안 된다
  ["저승사자", null],
];

function selfCheck() {
  const bad = CASES.filter(([input, want]) => politen(input) !== want);
  if (bad.length) {
    for (const [input, want] of bad) {
      console.error(`  self-check 실패: ${input} -> ${politen(input)} (기대: ${want})`);
    }
    throw new Error(`self-check ${bad.length}건 실패 — 사전/규칙이 깨졌다`);
  }
}

/** 해설 묶음에 남은 해라체 어절을 찾는다. 0이어야 한다. (테스트에서도 쓴다) */
export function findPlainForm(data) {
  const found = [];
  const visit = (node) => {
    if (typeof node === "string") {
      for (const m of node.matchAll(WORD)) {
        const w = m[0];
        if (alreadyPolite(w) || KEEP.has(w)) continue;
        found.push(w);
      }
    } else if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === "object") Object.values(node).forEach(visit);
  };
  // label 은 명사구라 종결형이 없다
  for (const entry of Object.values(data)) {
    for (const [k, v] of Object.entries(entry)) {
      if (k === "symbols") v.forEach((s) => visit(s.text));
      else visit(v);
    }
  }
  return found;
}

function main() {
  selfCheck();

  const raw = readFileSync(TARGET, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const before = JSON.parse(raw);
  const changes = [];
  const after = walk(before, changes);

  const left = findPlainForm(after);
  if (left.length) {
    const tally = new Map();
    for (const w of left) tally.set(w, (tally.get(w) ?? 0) + 1);
    console.error(`잔여 해라체 ${left.length}곳 (고유 ${tally.size}종) — 아무것도 쓰지 않았다.`);
    for (const [w, n] of [...tally].sort((a, b) => b[1] - a[1])) {
      console.error(`  ${String(n).padStart(3)}  ${w}`);
    }
    console.error("사전(IMPERATIVE/QUESTION/SPECIAL/VOWEL_PRED)에 추가하고 다시 돌려라.");
    process.exit(1);
  }

  if (!changes.length) {
    console.log("이미 존댓말 — 바꿀 것 없음 (멱등).");
    return;
  }

  const tally = new Map();
  for (const [a, b] of changes) tally.set(`${a} -> ${b}`, (tally.get(`${a} -> ${b}`) ?? 0) + 1);
  const top = [...tally].sort((x, y) => y[1] - x[1]).slice(0, 12);
  console.log(`${changes.length}곳 변환 (고유 ${tally.size}종)`);
  for (const [k, n] of top) console.log(`  ${String(n).padStart(3)}  ${k}`);

  if (check) {
    console.error("--check 모드: 변환할 것이 남아 있다.");
    process.exit(1);
  }

  const out = JSON.stringify(after, null, 2) + "\n";
  writeFileSync(TARGET, eol === "\r\n" ? out.replace(/\n/g, "\r\n") : out, "utf8");
  console.log(`기록: ${TARGET}`);
}

if (process.argv[1] && process.argv[1].endsWith("fix-ko-register.mjs")) main();
