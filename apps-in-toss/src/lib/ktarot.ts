import enrich from "../data/ktarot-ko.json";
import { TAROT_CARDS, type TarotCard } from "./tarot";
import type { UserSaju, WuXing } from "./saju-types";

// K-타로 한국어 보강 레이어.
//
// `ksaju-tarot.json`(78장 원본)은 4개 로케일을 쓰는 웹앱과 모양을 공유하므로
// 건드리지 않고, 한국어 보강만 `ktarot-ko.json` 으로 덧붙인다.
// 데이터는 `npm run gen:ktarot` 이 문서 두 개에서 생성한다.

/** 정방향 / 역방향. */
export type Orientation = "up" | "rev";

export type KTarotEntry = {
  up: string[];
  rev: string[];
  symbol: string;
  motif: string;
  /** 메이저 22장만 — 한국식 원작 이름("떠돌이 보부상"). */
  alias?: string;
  /** 메이저 22장만 — 작성된 본문. */
  reading?: { up: string; rev: string };
  /** 메이저 22장만 — 연애·일·돈·조언 3줄. */
  topics?: { love: string; work: string; advice: string };
  /** 메이저 22장만 — 모티프 훅 한 줄. */
  hook?: string;
};

const ENRICH = enrich as unknown as Record<string, KTarotEntry>;

export function getKTarot(id: number): KTarotEntry | null {
  return ENRICH[String(id)] ?? null;
}

/**
 * 카드의 오행.
 *
 * 원본 데이터는 메이저의 `element` 가 `null` 이라 오행 문장이 비어버린다.
 * 구조화 노트의 수트↔오행 대응이 남는 목(木)을 "메이저·카드 뒷면"에 주므로
 * 그대로 따른다 — 메이저는 '운명·큰 흐름'을 다루고 목이 그 자리다.
 */
export const MAJOR_ELEMENT: WuXing = "wood";

export function cardElement(card: TarotCard): WuXing {
  return card.element ?? MAJOR_ELEMENT;
}

/** Deterministic 32-bit FNV-1a hash. `tarot.ts`·`daily.ts` 와 같은 방식. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type Draw = { card: TarotCard; orientation: Orientation };

/**
 * 역방향이 나올 확률.
 *
 * 실물 덱은 50:50 이고, 해석 문안도 78장 전부에 역방향을 써 두었다. 역방향을
 * 넣는 이유가 "같은 카드를 다시 뽑아도 다른 이야기가 나오게" 하는 것이므로
 * 기본값은 절반으로 둔다. 너무 무겁게 느껴진다는 제보가 오면 이 숫자 하나만
 * 낮추면 된다(문안은 그대로 쓰인다).
 */
export const REVERSED_RATE = 0.5;

function orientationFrom(seed: string): Orientation {
  // 카드 선택과 다른 해시 공간을 쓴다 — 같은 시드를 그대로 나누면 카드와 방향이
  // 함께 움직여서, 특정 카드가 늘 같은 방향으로만 나온다.
  return (fnv1a(`orientation|${seed}`) % 1000) / 1000 < REVERSED_RATE
    ? "rev"
    : "up";
}

/** 오늘의 카드 — 사람·날짜가 같으면 카드도 방향도 고정된다. */
export function dailyDraw(saju: UserSaju, dateStr: string): Draw {
  const { year, month, day, hour } = saju.pillars;
  const seed = `${year}${month}${day}${hour ?? ""}|${dateStr}`;
  return {
    card: TAROT_CARDS[fnv1a(seed) % TAROT_CARDS.length],
    orientation: orientationFrom(seed),
  };
}

/** 3장 스프레드 — 뽑을 때마다 다르다. 테스트는 `rng` 를 넘긴다. */
export function spreadDraw(
  rng: () => number = Math.random,
): [Draw, Draw, Draw] {
  const deck = [...TAROT_CARDS];
  const drawn: Draw[] = [];
  for (let i = 0; i < 3; i++) {
    const j = i + Math.floor(rng() * (deck.length - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
    drawn.push({
      card: deck[i],
      orientation: rng() < REVERSED_RATE ? "rev" : "up",
    });
  }
  return [drawn[0], drawn[1], drawn[2]];
}
