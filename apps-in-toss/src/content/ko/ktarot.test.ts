import { describe, expect, it } from "vitest";
import { cardReadingKo, spreadReadingKo } from "./ktarot";
import { TAROT_CARDS } from "../../lib/tarot";
import { getKTarot, cardElement, type Draw, type Orientation } from "../../lib/ktarot";

const ORIENTATIONS: Orientation[] = ["up", "rev"];
const draw = (id: number, orientation: Orientation): Draw => ({
  card: TAROT_CARDS.find((c) => c.id === id)!,
  orientation,
});

describe("보강 데이터", () => {
  it("78장 전부 보강 레코드가 있다", () => {
    for (const card of TAROT_CARDS) {
      expect(getKTarot(card.id), `id ${card.id}`).not.toBeNull();
    }
  });

  // 원본은 메이저의 element 가 null 이라 오행 문장이 비어버린다.
  // 구조화 노트의 대응(메이저=목)으로 채운다.
  it("메이저도 오행이 비지 않는다 — 목(木)", () => {
    for (const card of TAROT_CARDS.filter((c) => c.suit === "major")) {
      expect(card.element).toBeNull(); // 원본은 그대로 둔다
      expect(cardElement(card)).toBe("wood");
    }
  });
});

describe("카드 리딩", () => {
  // 한 장이라도 빈 본문이면 그 카드를 뽑은 사람만 빈 화면을 본다.
  it("78장 × 정·역 156 경로가 전부 본문을 돌려준다", () => {
    for (const card of TAROT_CARDS) {
      for (const o of ORIENTATIONS) {
        const r = cardReadingKo(draw(card.id, o));
        expect(r.body.trim(), `id ${card.id} ${o}`).not.toBe("");
        expect(r.body.length).toBeGreaterThan(10);
        expect(r.hook.trim(), `id ${card.id} ${o} hook`).not.toBe("");
      }
    }
  });

  // 덱 그림에 카드 이름이 구워져 있다. 표시 이름이 그림과 달라지면 안 된다.
  it("표시 이름은 원본 name_kr 을 그대로 쓴다", () => {
    for (const card of TAROT_CARDS) {
      expect(cardReadingKo(draw(card.id, "up")).title).toBe(card.name_kr);
    }
  });

  it("메이저는 작성된 본문을 그대로 쓴다 (조립하지 않는다)", () => {
    const e = getKTarot(0)!;
    const up = cardReadingKo(draw(0, "up"));
    const rev = cardReadingKo(draw(0, "rev"));
    expect(up.body).toBe(e.reading!.up);
    expect(rev.body).toBe(e.reading!.rev);
    expect(up.body).not.toBe(rev.body);
  });

  it("메이저는 원작 이름을 부제로, 3줄을 함께 돌려준다", () => {
    const r = cardReadingKo(draw(0, "up"));
    expect(r.alias).toBe("떠돌이 보부상");
    expect(r.topics?.love).toBeTruthy();
    expect(r.topics?.work).toBeTruthy();
    expect(r.topics?.advice).toBeTruthy();
  });

  it("마이너는 3줄 대신 오행 조언 한 줄을 받는다", () => {
    const r = cardReadingKo(draw(36, "up")); // 잔의 에이스 (수)
    expect(r.topics).toBeUndefined();
    expect(r.advice).toContain("수");
    expect(r.alias).toBeUndefined();
  });

  // 전에는 수트만으로 문장을 만들어서 같은 수트면 뒷문장이 글자까지 같았다.
  it("같은 수트라도 카드마다 본문이 다르다", () => {
    const wands = TAROT_CARDS.filter((c) => c.suit === "wands");
    const bodies = new Set(wands.map((c) => cardReadingKo(draw(c.id, "up")).body));
    expect(bodies.size).toBe(wands.length);
  });

  it("정방향과 역방향이 서로 다른 문장이다", () => {
    for (const card of TAROT_CARDS) {
      const up = cardReadingKo(draw(card.id, "up")).body;
      const rev = cardReadingKo(draw(card.id, "rev")).body;
      expect(up, `id ${card.id}`).not.toBe(rev);
    }
  });

  // 10대도 보는 콘텐츠다. 역방향은 저주가 아니라 '속도 조절 신호'로만 푼다.
  it("단정·위협 표현을 쓰지 않는다", () => {
    for (const card of TAROT_CARDS) {
      for (const o of ORIENTATIONS) {
        const r = cardReadingKo(draw(card.id, o));
        const text = [r.body, r.advice, r.hook, ...Object.values(r.topics ?? {})]
          .filter(Boolean)
          .join(" ");
        expect(text, `id ${card.id} ${o}`).not.toMatch(
          /반드시|틀림없|위험해|불행|나쁜 일|죽을|하게 됩니다/,
        );
      }
    }
  });
});

describe("3장 스프레드", () => {
  it("자리 이름과 카드 리딩을 함께 돌려준다", () => {
    const r = spreadReadingKo([draw(0, "up"), draw(36, "rev"), draw(77, "up")]);
    expect(r.slots.map((s) => s.label)).toEqual(["과거", "현재", "미래"]);
    expect(r.slots[0].reading.title).toBe(TAROT_CARDS[0].name_kr);
    expect(r.synthesis.trim()).not.toBe("");
  });

  // 전에는 맺음말이 오행 하나로만 결정돼 조합이 달라도 늘 같은 문장이었다.
  it("카드 조합이 다르면 맺음말도 다르다", () => {
    const a = spreadReadingKo([draw(0, "up"), draw(36, "up"), draw(77, "up")]);
    const b = spreadReadingKo([draw(5, "up"), draw(40, "up"), draw(70, "up")]);
    expect(a.synthesis).not.toBe(b.synthesis);
  });

  it("같은 카드라도 방향이 다르면 맺음말이 바뀐다", () => {
    const a = spreadReadingKo([draw(0, "up"), draw(36, "up"), draw(77, "up")]);
    const b = spreadReadingKo([draw(0, "rev"), draw(36, "rev"), draw(77, "rev")]);
    expect(a.synthesis).not.toBe(b.synthesis);
  });
});

describe("마이너 조언", () => {
  // 조언을 수트당 하나만 두면 본문만 고쳐놓고 조언에서 예전 문제가 되살아난다.
  it("같은 수트라도 정방향과 역방향의 조언이 다르다", () => {
    const up = cardReadingKo(draw(22, "up")).advice;
    const rev = cardReadingKo(draw(22, "rev")).advice;
    expect(up).toBeTruthy();
    expect(rev).toBeTruthy();
    expect(up).not.toBe(rev);
  });

  // 조사가 틀리면 "의욕로" 처럼 바로 어색해진다.
  // '로' 는 받침이 없거나 'ㄹ' 받침일 때만 쓴다 — 그 밖에는 '으로' 여야 한다.
  it("'로/으로' 를 받침에 맞게 쓴다", () => {
    for (const card of TAROT_CARDS) {
      for (const o of ORIENTATIONS) {
        const body = cardReadingKo(draw(card.id, o)).body;
        const m = body.match(/(.)로 이어지는/);
        if (!m) continue;
        const jong = (m[1].charCodeAt(0) - 0xac00) % 28;
        expect([0, 8], `id ${card.id} ${o}: "${m[1]}로"`).toContain(jong);
      }
    }
  });

  it("조립 흔적이 문장에 새지 않는다", () => {
    for (const card of TAROT_CARDS) {
      for (const o of ORIENTATIONS) {
        const body = cardReadingKo(draw(card.id, o)).body;
        expect(body, `id ${card.id} ${o}`).not.toMatch(/undefined|\[object|NaN/);
      }
    }
  });
});
