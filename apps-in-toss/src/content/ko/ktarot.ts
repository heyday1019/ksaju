import { getKTarot, cardElement, type Orientation, type Draw } from "../../lib/ktarot";
import {
  joinWithAnd,
  withDirection,
  withSubject,
  withTopic,
} from "../../lib/ko-particle";
import { WUXING_KO } from "../../lib/saju-display";
import type { TarotCard } from "../../lib/tarot";

// 카드 한 장을 한국어 리딩으로 조립한다.
//
// 전에는 수트(5) × 오행(5) 만으로 문장을 만들어서, 78장을 뽑아도 실제 문장은
// 25종뿐이었고 같은 수트면 뒷문장이 글자까지 같았다. 이제 카드마다 다르다.
//
// 메이저 22장은 작성된 본문을 **그대로** 쓴다(조립하지 않는다).
// 마이너 56장은 본문이 아직 없어서 카드 고유 키워드 + 모티프로 조립한다.

export type CardReading = {
  /** 화면에 띄우는 카드 이름. 덱 그림에 구워진 이름과 같아야 한다. */
  title: string;
  /** 한국식 원작 이름. 메이저만 있다. 부제로 쓴다. */
  alias?: string;
  orientation: Orientation;
  orientationLabel: string;
  /** 본문 — 메이저는 작성된 문장, 마이너는 조립된 문장. */
  body: string;
  /** 메이저만. 연애·일·돈·조언 3줄. */
  topics?: { love: string; work: string; advice: string };
  /** 마이너는 오행 조언 한 줄이 이 자리에 온다. */
  advice?: string;
  /** 이야기 미끼 한 줄 — 메이저는 작성된 훅, 마이너는 모티프 메모. */
  hook: string;
};

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  up: "정방향",
  rev: "역방향",
};

/**
 * 수트별 조언. 오행 기운을 행동 한 줄로 바꾼다.
 *
 * 정방향과 역방향을 따로 둔다 — 하나만 두면 같은 수트의 14장이 전부 같은 조언을
 * 받아서, 본문만 고쳐놓고 조언에서 예전 문제가 되살아난다.
 */
const SUIT_ADVICE: Record<TarotCard["suit"], Record<Orientation, string>> = {
  major: {
    up: "큰 흐름에 맡기되, 오늘 할 수 있는 것 하나는 정해두세요.",
    rev: "흐름이 더딜 뿐이에요. 다음 한 걸음만 정해보세요.",
  },
  wands: {
    up: "먼저 한 발 떼는 쪽이 유리해요.",
    rev: "불을 더 키우기 전에 땔감이 남았는지 보세요.",
  },
  cups: {
    up: "마음이 가는 쪽을 한 번 더 들여다보세요.",
    rev: "감정을 덮지 말고 이름을 붙여보세요.",
  },
  swords: {
    up: "결정을 미루지 말고 기준부터 세워보세요.",
    rev: "날을 세우기 전에 사실부터 확인하세요.",
  },
  pentacles: {
    up: "눈에 보이는 것 하나를 정리해보세요.",
    rev: "서두르지 말고 들어온 것과 나간 것을 적어보세요.",
  },
};

/**
 * 마이너 본문 틀.
 *
 * 카드마다 2개 중 하나를 고른다(id 로 고정). 같은 수트가 연달아 나와도 문장
 * 모양이 번갈아 바뀌어 반복감이 덜하다.
 *
 * 역방향은 **저주가 아니라 속도 조절 신호**로만 푼다 — 해석 문안의 톤 규칙이고,
 * 부정 카드를 뽑아도 다시 오고 싶게 만드는 게 목적이다.
 */
const MINOR_TEMPLATE: Record<Orientation, ((k: string[]) => string)[]> = {
  up: [
    (k) =>
      `오늘은 ${withSubject(k[0])} 열리는 자리예요. ` +
      `${withDirection(k.slice(1).join(", "))} 이어지는 흐름이고요.`,
    (k) =>
      `${withTopic(k[0])} 지금 당신 쪽에 있어요. ` +
      `${joinWithAnd(k.slice(1))}도 함께 따라오는 때예요.`,
  ],
  rev: [
    (k) =>
      `지금은 ${withSubject(k[0])} 느껴질 수 있어요. ` +
      `멈추라는 뜻이 아니라 속도를 줄이라는 신호예요.`,
    (k) =>
      `${withSubject(k[0])} 눈에 띄는 날이에요. ` +
      `${k[1]} 쪽을 한 번 점검하면 흐름이 다시 풀려요.`,
  ],
};

/**
 * 카드 한 장 → 리딩.
 *
 * 보강 데이터가 없으면(생성기를 안 돌렸거나 id 가 어긋나면) 이름만이라도
 * 돌려준다 — 빈 화면을 보여주느니 낫다.
 */
export function cardReadingKo(draw: Draw): CardReading {
  const { card, orientation } = draw;
  const e = getKTarot(card.id);
  const orientationLabel = ORIENTATION_LABEL[orientation];
  const elementKo = WUXING_KO[cardElement(card)];

  if (!e) {
    return {
      title: card.name_kr,
      orientation,
      orientationLabel,
      body: `'${card.name_kr}' 카드예요.`,
      hook: "",
    };
  }

  // 메이저 — 작성된 본문을 그대로 쓴다
  if (e.reading && e.topics) {
    return {
      title: card.name_kr,
      alias: e.alias,
      orientation,
      orientationLabel,
      body: e.reading[orientation],
      topics: e.topics,
      hook: e.hook ?? e.motif,
    };
  }

  // 마이너 — 카드 고유 키워드로 조립
  const keywords = orientation === "up" ? e.up : e.rev;
  const template = MINOR_TEMPLATE[orientation][card.id % 2];
  return {
    title: card.name_kr,
    orientation,
    orientationLabel,
    body: template(keywords),
    advice: `${elementKo}의 기운이 도와요 — ${SUIT_ADVICE[card.suit][orientation]}`,
    hook: e.motif,
  };
}

export type SpreadReadingKo = {
  slots: { label: string; reading: CardReading }[];
  synthesis: string;
};

const SLOT_LABEL = ["과거", "현재", "미래"];

/**
 * 3장 스프레드.
 *
 * 자리마다 카드 리딩을 그대로 싣고, 마지막에 세 장의 **첫 키워드**를 엮어
 * 한 줄로 맺는다. 전에는 맺음말이 오행 하나로만 결정돼 늘 같았다.
 */
export function spreadReadingKo(draws: [Draw, Draw, Draw]): SpreadReadingKo {
  const slots = draws.map((d, i) => ({
    label: SLOT_LABEL[i],
    reading: cardReadingKo(d),
  }));

  const key = (d: Draw) => {
    const e = getKTarot(d.card.id);
    if (!e) return d.card.name_kr;
    return (d.orientation === "up" ? e.up : e.rev)[0];
  };
  const [p, c, f] = draws.map(key);

  return {
    slots,
    synthesis:
      `${withTopic(p)} 지나온 자리, 지금 당신은 ${withSubject(c)} 한가운데예요. ` +
      `그 다음에 ${withSubject(f)} 기다리고 있고요. ` +
      `오늘 할 일 하나만 정해서 그쪽으로 한 걸음 옮겨보세요. ✨`,
  };
}
