# Tarot Card Guides (`/cards`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a `/cards` library of long-form tarot interpretations — hub plus one page per card, in four locales — to accumulate original text for AdSense re-approval, capture `"<card> tarot card meaning"` search traffic, and route readers to the Ko-fi deck.

**Architecture:** Two new routes inside the existing `[locale]` segment. Prose lives in four locale-keyed JSON files under `data/card-guides/`, read only by Server Components so it never enters the client bundle. A **publish gate** — the intersection of the four files' slug sets — is the single source of truth for which cards are routed, listed, linked, and put in the sitemap, which lets content land incrementally without ever exposing a half-translated page. A one-off Node script drafts prose via OpenRouter at authoring time; the app itself makes no LLM calls and every page is static.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.9, Tailwind v4, next-intl, vitest + @testing-library/react + happy-dom. No new npm packages.

**Spec:** `docs/superpowers/specs/2026-09-04-card-guides-design.md`

## Global Constraints

- **No new npm packages.** Not for Markdown, not for YAML frontmatter, not for slugs.
- **Guide prose must never enter `messages/*.json`.** Those are shipped to the browser via `NextIntlClientProvider`. `messages/` gets chrome labels only.
- **Only `card-cta.tsx` may be a Client Component.** Every other new component is a Server Component.
- **The publish gate is the intersection of all four locale files.** `generateStaticParams`, the hub grid, `relatedCards`, and the sitemap all read `publishedSlugs()` — never a raw file's keys.
- **`dynamicParams = false`** on the `[slug]` segment.
- **Do not modify** `data/ksaju-tarot.json`, `scripts/seed-tarot.mjs`, `src/lib/tarot.ts`, `src/app/api/tarot-reading/route.ts`, or anything under `/tarot` beyond adding one link.
- **Ko-fi link:** `https://ko-fi.com/ksaju` with `target="_blank"` and `rel="noopener noreferrer"`.
- **Locales, in this order everywhere:** `en`, `ko`, `ja`, `zh-TW`.
- **Disclaimer tone:** the site is `For entertainment 🌙`. Never claim accuracy or real divination.
- **Component tests** need the `// @vitest-environment happy-dom` pragma on line 1 (the global env is `node`).
- **Run from the repo root.** `apps-in-toss/` is a separate project and is excluded from this vitest config.

---

### Task 1: Slug derivation and card lookup

Slugs are derived from `name_en` rather than stored, so `data/ksaju-tarot.json` stays owned solely by `scripts/seed-tarot.mjs`. All 78 cards produce unique slugs — the test locks that in.

**Files:**
- Create: `src/lib/card-guides.ts`
- Create: `src/lib/card-guides.test.ts`

**Interfaces:**
- Consumes: `TAROT_CARDS`, `type TarotCard` from `src/lib/tarot.ts`
- Produces: `cardSlug(card: TarotCard): string`, `cardBySlug(slug: string): TarotCard | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/card-guides.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { TAROT_CARDS } from "./tarot";
import { cardSlug, cardBySlug } from "./card-guides";

describe("cardSlug", () => {
  it("produces a unique slug for all 78 cards", () => {
    const slugs = TAROT_CARDS.map(cardSlug);
    expect(slugs).toHaveLength(78);
    expect(new Set(slugs).size).toBe(78);
  });

  it("produces URL-safe slugs only", () => {
    for (const slug of TAROT_CARDS.map(cardSlug)) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("matches known answers", () => {
    const bySlugName = (name: string) =>
      cardSlug(TAROT_CARDS.find((c) => c.name_en === name)!);
    expect(bySlugName("The Fool")).toBe("the-fool");
    expect(bySlugName("The High Priestess")).toBe("the-high-priestess");
    expect(bySlugName("Ace of Wands")).toBe("ace-of-wands");
    expect(bySlugName("King of Pentacles")).toBe("king-of-pentacles");
  });
});

describe("cardBySlug", () => {
  it("round-trips every card", () => {
    for (const card of TAROT_CARDS) {
      expect(cardBySlug(cardSlug(card))?.id).toBe(card.id);
    }
  });

  it("returns null for an unknown slug", () => {
    expect(cardBySlug("not-a-card")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/card-guides.test.ts`
Expected: FAIL — `Failed to resolve import "./card-guides"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/card-guides.ts`:

```ts
import { TAROT_CARDS, type TarotCard } from "./tarot";

/** "Ace of Wands" → "ace-of-wands". Derived, never stored — seed-tarot.mjs owns the card JSON. */
export function cardSlug(card: TarotCard): string {
  return card.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BY_SLUG = new Map(TAROT_CARDS.map((c) => [cardSlug(c), c]));

export function cardBySlug(slug: string): TarotCard | null {
  return BY_SLUG.get(slug) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/card-guides.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/card-guides.ts src/lib/card-guides.test.ts
git commit -m "feat(cards): 카드 슬러그 파생 + 역조회"
```

---

### Task 2: Guide data files, the publish gate, and the parity test

The Fool is written by hand in all four locales here. It serves three jobs at once: it gives the tests real data, it anchors the house voice, and Task 10's generator uses it as a few-shot example so the other 21 cards sound like it.

`symbols` describes what is genuinely drawn on the card. The KSaju art was generated from the `card_prompt` column of `docs/tarot-cards.csv`, so that column — not invention — is the source for this field.

**Files:**
- Create: `data/card-guides/en.json`, `data/card-guides/ko.json`, `data/card-guides/ja.json`, `data/card-guides/zh-TW.json`
- Modify: `src/lib/card-guides.ts`
- Modify: `src/lib/card-guides.test.ts`
- Create: `src/lib/card-guides-parity.test.ts`

**Interfaces:**
- Consumes: `cardSlug`, `TAROT_CARDS`, `type Locale` from `src/i18n/routing.ts`
- Produces: `type CardGuide`, `getGuide(locale: Locale, slug: string): CardGuide | null`, `publishedSlugs(): string[]`

- [ ] **Step 1: Write the failing tests**

In `src/lib/card-guides.test.ts`, extend the existing import so it reads
`import { cardSlug, cardBySlug, getGuide, publishedSlugs } from "./card-guides";`
(do not add a second import statement mid-file — `import/first` will flag it), then
append:

```ts
describe("publishedSlugs", () => {
  it("only lists slugs present in all four locale files", () => {
    const published = publishedSlugs();
    for (const slug of published) {
      for (const locale of ["en", "ko", "ja", "zh-TW"] as const) {
        expect(getGuide(locale, slug)).not.toBeNull();
      }
    }
  });

  it("includes the-fool", () => {
    expect(publishedSlugs()).toContain("the-fool");
  });

  it("orders slugs by card id", () => {
    const published = publishedSlugs();
    const ids = published.map((s) => TAROT_CARDS.find((c) => cardSlug(c) === s)!.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it("never lists a slug that is not a real card", () => {
    for (const slug of publishedSlugs()) {
      expect(cardBySlug(slug)).not.toBeNull();
    }
  });
});

describe("getGuide", () => {
  it("returns a fully populated guide for the-fool in every locale", () => {
    for (const locale of ["en", "ko", "ja", "zh-TW"] as const) {
      const guide = getGuide(locale, "the-fool")!;
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.summary.length).toBeGreaterThan(0);
      expect(guide.meaning.length).toBeGreaterThanOrEqual(2);
      expect(guide.symbols.length).toBeGreaterThanOrEqual(3);
      expect(guide.upright.length).toBeGreaterThan(0);
      expect(guide.reversed.length).toBeGreaterThan(0);
      expect(guide.sajuLens.length).toBeGreaterThan(0);
    }
  });

  it("returns null for an unwritten card", () => {
    expect(getGuide("en", "not-a-card")).toBeNull();
  });
});
```

Create `src/lib/card-guides-parity.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import en from "../../data/card-guides/en.json";
import ko from "../../data/card-guides/ko.json";
import ja from "../../data/card-guides/ja.json";
import zhTW from "../../data/card-guides/zh-TW.json";
import type { CardGuide } from "./card-guides";

type GuideFile = Record<string, CardGuide>;

const OTHERS: Array<[string, GuideFile]> = [
  ["ko", ko as GuideFile],
  ["ja", ja as GuideFile],
  ["zh-TW", zhTW as GuideFile],
];

const FIELDS = [
  "title", "summary", "meaning", "symbols",
  "upright", "reversed", "love", "work", "sajuLens",
] as const;

describe("card guide locale parity", () => {
  const enFile = en as GuideFile;
  const enSlugs = Object.keys(enFile).sort();

  it.each(OTHERS)("%s covers exactly the same slugs as en", (_name, file) => {
    expect(Object.keys(file).sort()).toEqual(enSlugs);
  });

  it.each([["en", enFile], ...OTHERS])("%s has every field on every card", (_name, file) => {
    for (const [slug, guide] of Object.entries(file)) {
      for (const field of FIELDS) {
        expect(guide[field], `${slug}.${field}`).toBeDefined();
      }
      expect(guide.meaning.length, `${slug}.meaning`).toBeGreaterThanOrEqual(2);
      expect(guide.symbols.length, `${slug}.symbols`).toBeGreaterThanOrEqual(3);
    }
  });

  it.each([["en", enFile], ...OTHERS])("%s has no blank strings", (_name, file) => {
    for (const [slug, guide] of Object.entries(file)) {
      expect(guide.title.trim(), `${slug}.title`).not.toBe("");
      expect(guide.summary.trim(), `${slug}.summary`).not.toBe("");
      expect(guide.upright.trim(), `${slug}.upright`).not.toBe("");
      expect(guide.reversed.trim(), `${slug}.reversed`).not.toBe("");
      expect(guide.love.trim(), `${slug}.love`).not.toBe("");
      expect(guide.work.trim(), `${slug}.work`).not.toBe("");
      expect(guide.sajuLens.trim(), `${slug}.sajuLens`).not.toBe("");
      for (const p of guide.meaning) expect(p.trim(), `${slug}.meaning[]`).not.toBe("");
      for (const s of guide.symbols) {
        expect(s.label.trim(), `${slug}.symbols[].label`).not.toBe("");
        expect(s.text.trim(), `${slug}.symbols[].text`).not.toBe("");
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/card-guides.test.ts src/lib/card-guides-parity.test.ts`
Expected: FAIL — cannot resolve `../../data/card-guides/en.json`.

- [ ] **Step 3: Create the four data files**

Create `data/card-guides/en.json`:

```json
{
  "the-fool": {
    "title": "The Fool",
    "summary": "The Fool is card 0 of the Major Arcana — the step taken before you know where it lands. What it means upright, reversed, and through a saju lens.",
    "meaning": [
      "Every tarot deck opens with a number that is barely a number. The Fool is card zero, standing outside the sequence the other twenty-one Major Arcana move through — not yet on the journey, and therefore free to begin it anywhere. In the KSaju deck he is a 광대, one of the travelling entertainers who worked the market squares of Joseon: a performer who belonged to no village and was, for exactly that reason, welcome in all of them.",
      "What the card describes is not recklessness but weightlessness. The Fool has no reputation to defend, no established method to protect, no sunk cost quietly steering him back toward a road he has already outgrown. When he turns up in a reading he seldom asks whether you are ready — readiness is mostly a story we assemble afterward. He asks what you are still carrying that you have stopped using."
    ],
    "symbols": [
      {
        "label": "The hahoetal, pushed back",
        "text": "The mask sits on top of his head rather than over his face. He has not put the performance away, but he is not hiding behind it either — this is the card of someone who has stopped performing just long enough to move."
      },
      {
        "label": "The bundle on a bamboo staff",
        "text": "Everything he owns fits inside one cloth knot. Whether that reads as poverty or as freedom is the question the card is actually asking."
      },
      {
        "label": "One foot over the edge",
        "text": "His weight has already left the rock. The decision is behind him; only the landing is unknown. Notice that his expression has not changed at all."
      },
      {
        "label": "White butterflies and falling blossom",
        "text": "Both are short-lived and both are in motion. In Korean painting the pair marks a moment that is beautiful precisely because it will not hold still."
      }
    ],
    "upright": "Something is beginning and you do not yet have enough to justify it. That is normal — the Fool's whole argument is that first steps are taken on appetite, not on evidence. Say yes to the thing you cannot fully explain, keep your commitments light enough to carry, and let the plan assemble itself once you are already moving. This card favours the beginner precisely because the beginner has not yet been taught what is supposedly impossible.",
    "reversed": "The leap is being taken without the lightness that makes it work. Reversed, the Fool points either to a jump made to escape something rather than to reach something, or to a bundle that has quietly grown too heavy to carry over a cliff. Before you move, check whether you are genuinely free or merely impatient.",
    "love": "New feeling, no track record. Enjoy it as it is instead of auditioning it for a future.",
    "work": "A first attempt or an unfamiliar role. Your inexperience is an asset right now — spend it before it wears off.",
    "sajuLens": "Saju has no card zero, but it has 목(木) — wood: the energy of spring, of sap rising, of a shoot pushing through ground that has not finished thawing. Wood is the fuel the Fool runs on: outward expansion, tolerance for uncertainty, growth that starts before conditions are ideal. If your 일간 (Day Master) is a wood stem, this card usually reads as permission, because it is describing how you already work. If your chart leans 금(金) — metal, which prizes structure, edges and finished form — the Fool arrives as friction rather than encouragement, and what it is pointing at is usually the plan you polished one revision past the moment you should have shipped it."
  }
}
```

Create `data/card-guides/ko.json`:

```json
{
  "the-fool": {
    "title": "광대 · The Fool",
    "summary": "메이저 아르카나 0번 광대 — 어디에 닿을지 알기 전에 내딛는 걸음. 정방향·역방향 의미와 사주로 읽는 이 카드.",
    "meaning": [
      "모든 타로 덱은 숫자라고 하기 애매한 숫자로 시작합니다. 광대는 0번 카드로, 나머지 스물한 장의 메이저 아르카나가 지나가는 순서 바깥에 서 있습니다. 아직 여정에 오르지 않았고, 그래서 어디서든 시작할 수 있습니다. KSaju 덱에서 그는 조선의 장터를 떠돌던 광대입니다. 어느 마을에도 속하지 않았고, 바로 그 이유로 모든 마을에서 환영받던 사람이죠.",
      "이 카드가 말하는 것은 무모함이 아니라 가벼움입니다. 광대에게는 지켜야 할 평판도, 방어해야 할 방식도, 이미 벗어난 길로 조용히 되돌리는 매몰비용도 없습니다. 리딩에 이 카드가 나올 때 그는 준비가 됐는지 거의 묻지 않습니다. 준비란 대개 나중에 지어내는 이야기니까요. 대신 묻습니다. 더 이상 쓰지 않으면서 아직 들고 있는 게 무엇이냐고."
    ],
    "symbols": [
      {
        "label": "뒤로 젖힌 하회탈",
        "text": "탈은 얼굴이 아니라 머리 위에 얹혀 있습니다. 연희를 접은 것도 아니지만 그 뒤에 숨지도 않습니다. 움직일 만큼은 연기를 멈춘 사람의 카드입니다."
      },
      {
        "label": "대나무 막대에 걸린 봇짐",
        "text": "가진 전부가 보자기 매듭 하나에 들어갑니다. 그게 가난으로 보이는지 자유로 보이는지 — 카드가 실제로 묻는 건 그겁니다."
      },
      {
        "label": "허공에 뜬 한쪽 발",
        "text": "무게는 이미 바위를 떠났습니다. 결정은 끝났고 착지만 모릅니다. 그런데 표정이 조금도 변하지 않았다는 점을 보세요."
      },
      {
        "label": "흰 나비와 흩날리는 꽃잎",
        "text": "둘 다 짧게 살고 둘 다 움직이는 중입니다. 한국 그림에서 이 둘은 가만히 있지 않기 때문에 아름다운 순간을 표시합니다."
      }
    ],
    "upright": "무언가 시작되고 있는데 아직 그걸 정당화할 근거가 부족합니다. 정상입니다. 첫걸음은 증거가 아니라 이끌림으로 떼어진다는 것이 광대의 논지니까요. 다 설명하지 못하는 일에 예라고 답하고, 짊어질 수 있을 만큼만 약속하고, 움직이기 시작한 다음에 계획이 스스로 맞춰지게 두세요. 이 카드가 초심자를 편드는 이유는 초심자가 아직 무엇이 불가능한지 배우지 않았기 때문입니다.",
    "reversed": "도약은 하는데 그걸 성립시키는 가벼움이 없습니다. 역방향의 광대는 무언가를 향해서가 아니라 무언가로부터 도망치려는 뜀박질을 가리키거나, 절벽을 넘기엔 봇짐이 어느새 너무 무거워졌음을 가리킵니다. 움직이기 전에 지금 자신이 정말 자유로운지, 아니면 그냥 조급한 건지 확인해 보세요.",
    "love": "새로운 감정, 아직 없는 기록. 미래를 심사하지 말고 지금 그대로 즐기세요.",
    "work": "처음 해보는 일이거나 낯선 역할. 지금은 경험 없음이 자산입니다. 닳기 전에 쓰세요.",
    "sajuLens": "사주에는 0번 카드가 없지만 목(木)이 있습니다. 봄의 기운, 물오르는 나무, 아직 다 녹지 않은 땅을 뚫고 나오는 싹입니다. 광대를 움직이는 연료가 바로 이 목 기운입니다. 바깥으로 뻗는 확장, 불확실함을 견디는 힘, 조건이 갖춰지기 전에 시작하는 성장이죠. 일간이 목이라면 이 카드는 대개 허락처럼 읽힙니다. 이미 그렇게 살고 있다는 이야기니까요. 반대로 사주가 금(金) 쪽으로 기울어 구조와 완성된 형태를 중히 여긴다면, 광대는 격려가 아니라 마찰로 옵니다. 그리고 그럴 때 이 카드가 가리키는 건 보통, 내보냈어야 할 시점을 한 번 더 다듬어 넘겨버린 바로 그 계획입니다."
  }
}
```

Create `data/card-guides/ja.json`:

```json
{
  "the-fool": {
    "title": "愚者 · The Fool",
    "summary": "大アルカナ0番「愚者」——どこに着地するか分からないまま踏み出す一歩。正位置・逆位置の意味と、四柱推命から読むこのカード。",
    "meaning": [
      "すべてのタロットデッキは、数と呼ぶには曖昧な数から始まります。愚者は0番のカード。残る二十一枚の大アルカナが辿る順序の外側に立っていて、まだ旅に出ていない。だからこそ、どこからでも始められます。KSajuのデッキでは、朝鮮の市場を巡り歩いた芸人クァンデとして描かれています。どの村にも属さず、まさにその理由ですべての村に迎え入れられた人です。",
      "このカードが語るのは無謀さではなく、軽さです。愚者には守るべき評判も、擁護すべき流儀も、すでに脱した道へ静かに引き戻す埋没費用もありません。リーディングに現れるとき、彼が準備はできたかと問うことはほとんどありません。準備とは大抵、後から組み立てる物語だからです。代わりにこう問います。もう使っていないのに、まだ抱えているものは何か。"
    ],
    "symbols": [
      {
        "label": "頭に上げたハフェタル",
        "text": "仮面は顔ではなく頭の上に載っています。芸をやめたわけではないけれど、その陰に隠れてもいない。動けるだけは演じるのをやめた人のカードです。"
      },
      {
        "label": "竹の棒に掛けた包み",
        "text": "持ち物のすべてが風呂敷の結び目ひとつに収まります。それが貧しさに見えるか自由に見えるか。カードが本当に問うているのはそこです。"
      },
      {
        "label": "宙に浮いた片足",
        "text": "体重はすでに岩を離れています。決断は終わり、着地だけが分からない。それでも表情が少しも変わっていないことに注目してください。"
      },
      {
        "label": "白い蝶と舞う花びら",
        "text": "どちらも短命で、どちらも動いている最中です。韓国の絵画でこの二つは、静止しないからこそ美しい瞬間を示します。"
      }
    ],
    "upright": "何かが始まっているのに、それを正当化する材料がまだ足りない。それで正常です。最初の一歩は証拠ではなく衝動で踏み出される、というのが愚者の主張だからです。うまく説明できない事柄に「はい」と答え、背負える分だけ約束し、動き出してから計画が自ずと形になるのに任せてください。このカードが初心者に味方するのは、初心者がまだ何が不可能かを教わっていないからです。",
    "reversed": "跳躍はしているのに、それを成立させる軽さがありません。逆位置の愚者は、何かへ向かうためではなく何かから逃げるための跳躍を指すか、崖を越えるには包みがいつのまにか重くなりすぎたことを指します。動く前に、自分が本当に自由なのか、それともただ焦っているだけなのかを確かめてください。",
    "love": "新しい感情、まだ実績はなし。未来を審査せず、今のまま楽しんでください。",
    "work": "初めての仕事、あるいは不慣れな役割。今は経験のなさが資産です。すり減る前に使いましょう。",
    "sajuLens": "四柱推命に0番のカードはありませんが、木(もく)があります。春の気、水を上げる樹、まだ溶けきらない土を破って出る芽です。愚者を動かしている燃料がこの木の気です。外へ伸びる拡張、不確かさに耐える力、条件が整う前に始まる成長。日干が木なら、このカードはたいてい許可のように読めます。すでにそう生きているという話だからです。逆に命式が金(ごん)寄りで、構造と完成された形を重んじるなら、愚者は励ましではなく摩擦として現れます。そしてそのとき指しているのは大抵、世に出すべき時期をもう一度磨いて逃した、まさにその計画です。"
  }
}
```

Create `data/card-guides/zh-TW.json`:

```json
{
  "the-fool": {
    "title": "愚者 · The Fool",
    "summary": "大阿爾克那 0 號「愚者」——在不知會落在何處之前先踏出的那一步。正位與逆位的意義，以及從四柱命理讀這張牌。",
    "meaning": [
      "每一副塔羅牌都以一個算不上數字的數字開場。愚者是 0 號牌，站在其餘二十一張大阿爾克那所行經的次序之外。他尚未踏上旅程，也正因如此，可以從任何地方開始。在 KSaju 這副牌裡，他是遊走朝鮮市集的藝人광대：不屬於任何村莊，也恰恰因為這樣，每一個村莊都歡迎他。",
      "這張牌說的不是魯莽，而是輕。愚者沒有需要維護的名聲，沒有必須辯護的做法，也沒有把他悄悄拉回早已走過的路上的沉沒成本。當他出現在牌陣中，他很少問你是否準備好了。準備多半是我們事後才編出來的說法。他問的是：有什麼東西你已經不再使用，卻還揹著？"
    ],
    "symbols": [
      {
        "label": "推到頭頂的河回面具",
        "text": "面具落在頭上而不是臉上。他沒有收起表演，卻也沒有躲在表演後面。這是一張暫停演出到足以動身的牌。"
      },
      {
        "label": "竹杖上的包袱",
        "text": "全部家當收在一個布結裡。那看起來像貧窮還是像自由——這才是牌真正在問的。"
      },
      {
        "label": "懸空的那隻腳",
        "text": "重心已經離開岩石。決定做完了，只剩落點未知。請注意，他的表情沒有絲毫改變。"
      },
      {
        "label": "白蝴蝶與飄落的花瓣",
        "text": "兩者都短命，兩者都在移動之中。在韓國繪畫裡，這兩樣標記的正是因為不肯靜止而美的片刻。"
      }
    ],
    "upright": "有些事正在開始，而你還沒有足以說服人的理由。這很正常——愚者的整個論點就是：第一步是憑著渴望邁出的，不是憑著證據。對那件你還說不清楚的事說好，把承諾維持在揹得動的重量，然後讓計畫在你已經上路之後自行成形。這張牌偏袒新手，正因為新手還沒學會什麼叫做不可能。",
    "reversed": "跳是跳了，卻少了讓這一跳成立的輕盈。逆位的愚者指向一次為了逃離而非為了抵達的縱身，或是指向一個不知不覺重到過不了懸崖的包袱。在移動之前，先確認你是真的自由，還是只是不耐煩。",
    "love": "新的感覺，還沒有紀錄可循。就照現在的樣子享受它，別急著替它面試未來。",
    "work": "第一次做的專案，或一個陌生的角色。你的沒經驗此刻是資產——趁它還在的時候用掉。",
    "sajuLens": "四柱命理裡沒有 0 號牌，但有木。木是春天的氣、是往上走的樹液、是頂開尚未完全解凍的土冒出來的芽。推著愚者前進的燃料正是這股木氣：向外的擴張、對不確定的耐受、在條件齊備之前就開始的生長。如果你的日干屬木，這張牌讀起來多半像一張許可，因為它描述的就是你本來的運作方式。若你的命盤偏金，看重結構、邊界與完成的形狀，愚者到來時就不是鼓勵而是摩擦，而它通常指的，正是那個你多修了一版、剛好錯過該送出去的時機的計畫。"
  }
}
```

- [ ] **Step 4: Extend `src/lib/card-guides.ts`**

Add the imports at the top of the file, after the existing `tarot` import:

```ts
import type { Locale } from "@/i18n/routing";
import enGuides from "../../data/card-guides/en.json";
import koGuides from "../../data/card-guides/ko.json";
import jaGuides from "../../data/card-guides/ja.json";
import zhTWGuides from "../../data/card-guides/zh-TW.json";
```

Then append:

```ts
export type CardGuide = {
  title: string;
  summary: string;
  meaning: string[];
  symbols: { label: string; text: string }[];
  upright: string;
  reversed: string;
  love: string;
  work: string;
  sajuLens: string;
};

type GuideFile = Record<string, CardGuide>;

const GUIDES: Record<Locale, GuideFile> = {
  en: enGuides as GuideFile,
  ko: koGuides as GuideFile,
  ja: jaGuides as GuideFile,
  "zh-TW": zhTWGuides as GuideFile,
};

export function getGuide(locale: Locale, slug: string): CardGuide | null {
  return GUIDES[locale]?.[slug] ?? null;
}

/**
 * 발행 게이트 — 4개 로케일 파일에 모두 존재하는 슬러그만.
 * 라우팅·허브·사이트맵·관련카드가 전부 이 함수 하나를 본다.
 * 반쯤 번역된 카드는 어느 언어에서도 존재하지 않는다.
 */
export function publishedSlugs(): string[] {
  const files = Object.values(GUIDES);
  return TAROT_CARDS.map(cardSlug).filter((slug) => files.every((f) => slug in f));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/card-guides.test.ts src/lib/card-guides-parity.test.ts`
Expected: PASS (all tests, 11+ assertions across both files)

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add data/card-guides src/lib/card-guides.ts src/lib/card-guides.test.ts src/lib/card-guides-parity.test.ts
git commit -m "feat(cards): 해설 데이터 4개 로케일 + 발행 게이트 + parity 테스트"
```

---

### Task 3: Related cards

Internal links between card pages. The published-set filter is the point of this task: with 22 of 78 cards live, an unfiltered neighbour list would link straight into 404s and feed dead URLs to the crawler.

**Files:**
- Modify: `src/lib/card-guides.ts`
- Modify: `src/lib/card-guides.test.ts`

**Interfaces:**
- Consumes: `cardSlug`, `publishedSlugs`, `TAROT_CARDS`
- Produces: `relatedCards(card: TarotCard, published?: Set<string>): TarotCard[]`

- [ ] **Step 1: Write the failing test**

In `src/lib/card-guides.test.ts`, add `relatedCards` to the existing import from
`./card-guides`, then append:

```ts
describe("relatedCards", () => {
  const majors = TAROT_CARDS.filter((c) => c.suit === "major");
  const allMajors = new Set(majors.map(cardSlug));
  const card = (name: string) => TAROT_CARDS.find((c) => c.name_en === name)!;

  it("returns four neighbours ordered prev, next, prev2, next2", () => {
    const related = relatedCards(card("The Chariot"), allMajors); // id 7
    expect(related.map((c) => c.id)).toEqual([6, 8, 5, 9]);
  });

  it("wraps around the suit boundary", () => {
    const related = relatedCards(card("The Fool"), allMajors); // id 0
    expect(related.map((c) => c.id)).toEqual([21, 1, 20, 2]);
  });

  it("never includes the card itself", () => {
    for (const c of majors) {
      expect(relatedCards(c, allMajors).some((r) => r.id === c.id)).toBe(false);
    }
  });

  it("stays inside the same suit", () => {
    const wands = new Set(
      TAROT_CARDS.filter((c) => c.suit === "wands").map(cardSlug),
    );
    for (const c of TAROT_CARDS.filter((x) => x.suit === "wands")) {
      expect(relatedCards(c, wands).every((r) => r.suit === "wands")).toBe(true);
    }
  });

  it("omits unpublished cards", () => {
    const onlyThree = new Set(["the-fool", "the-magician", "the-world"]);
    const related = relatedCards(card("The Fool"), onlyThree);
    expect(related.map(cardSlug)).toEqual(["the-world", "the-magician"]);
  });

  it("returns an empty list when nothing else is published", () => {
    expect(relatedCards(card("The Fool"), new Set(["the-fool"]))).toEqual([]);
  });

  it("defaults to the real published set", () => {
    const related = relatedCards(card("The Fool"));
    const published = new Set(publishedSlugs());
    expect(related.every((c) => published.has(cardSlug(c)))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/card-guides.test.ts -t relatedCards`
Expected: FAIL — `relatedCards is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/lib/card-guides.ts`:

```ts
/**
 * 같은 수트 안에서 자기 자신 바깥으로 걸어나가며(-1, +1, -2, +2 …) 발행된 카드만 모은다.
 * `published` 필터가 핵심 — 22/78장만 발행된 상태에서 거르지 않으면 404로 링크가 나간다.
 */
export function relatedCards(
  card: TarotCard,
  published: Set<string> = new Set(publishedSlugs()),
  limit = 4,
): TarotCard[] {
  const suit = TAROT_CARDS.filter((c) => c.suit === card.suit);
  const n = suit.length;
  const idx = suit.findIndex((c) => c.id === card.id);
  if (idx === -1) return [];

  const out: TarotCard[] = [];
  for (let step = 1; step <= Math.floor(n / 2) && out.length < limit; step++) {
    for (const dir of [-1, 1] as const) {
      if (out.length >= limit) break;
      const c = suit[(((idx + dir * step) % n) + n) % n];
      if (c.id === card.id) continue;
      if (!published.has(cardSlug(c))) continue;
      if (out.some((o) => o.id === c.id)) continue;
      out.push(c);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/card-guides.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/card-guides.ts src/lib/card-guides.test.ts
git commit -m "feat(cards): 관련 카드 내부 링크(발행분만)"
```

---

### Task 4: `Cards` message namespace

Chrome labels only — section headings, CTA text, hub copy. No guide prose, because `messages/` is shipped to the browser.

**Files:**
- Modify: `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh-TW.json`

**Interfaces:**
- Produces: the `Cards` namespace, consumed via `useTranslations("Cards")` and `getTranslations("Cards")` in Tasks 5–8.

- [ ] **Step 1: Add the namespace to all four message files**

Add a `"Cards"` object to each file, as a sibling of the existing `"Tarot"` key.

`messages/en.json`:

```json
  "Cards": {
    "metaTitle": "Tarot Card Meanings",
    "metaDescription": "What each tarot card means — upright, reversed, and read through Korean saju.",
    "hubTitle": "Card meanings",
    "hubIntro": "Every card in the deck, read twice: the way tarot has always read it, and the way it looks through saju.",
    "suitMajor": "Major Arcana",
    "suitWands": "Wands",
    "suitCups": "Cups",
    "suitSwords": "Swords",
    "suitPentacles": "Pentacles",
    "meaningHeading": "What the card means",
    "symbolsHeading": "Symbols in the art",
    "uprightHeading": "Upright",
    "reversedHeading": "Reversed",
    "loveLabel": "In love",
    "workLabel": "In work",
    "sajuHeading": "Through a saju lens",
    "relatedHeading": "Related cards",
    "ctaTarot": "Pull your daily card →",
    "ctaDeck": "Get the full deck →",
    "backToHub": "← All card meanings"
  },
```

`messages/ko.json`:

```json
  "Cards": {
    "metaTitle": "타로 카드 의미",
    "metaDescription": "카드 한 장 한 장의 의미 — 정방향, 역방향, 그리고 사주로 읽기.",
    "hubTitle": "카드 해설",
    "hubIntro": "덱의 모든 카드를 두 번 읽습니다. 타로가 늘 읽어온 방식으로 한 번, 사주로 한 번.",
    "suitMajor": "메이저 아르카나",
    "suitWands": "봉",
    "suitCups": "잔",
    "suitSwords": "검",
    "suitPentacles": "금화",
    "meaningHeading": "이 카드의 의미",
    "symbolsHeading": "그림 속 상징",
    "uprightHeading": "정방향",
    "reversedHeading": "역방향",
    "loveLabel": "연애에서",
    "workLabel": "일에서",
    "sajuHeading": "사주로 읽으면",
    "relatedHeading": "관련 카드",
    "ctaTarot": "오늘의 카드 뽑기 →",
    "ctaDeck": "전체 덱 받기 →",
    "backToHub": "← 전체 카드 해설"
  },
```

`messages/ja.json`:

```json
  "Cards": {
    "metaTitle": "タロットカードの意味",
    "metaDescription": "一枚ずつのカードの意味——正位置、逆位置、そして四柱推命から読む。",
    "hubTitle": "カード解説",
    "hubIntro": "デッキのすべてのカードを二度読みます。タロットがずっと読んできたやり方で一度、四柱推命で一度。",
    "suitMajor": "大アルカナ",
    "suitWands": "棒",
    "suitCups": "杯",
    "suitSwords": "剣",
    "suitPentacles": "金貨",
    "meaningHeading": "このカードの意味",
    "symbolsHeading": "絵の中の象徴",
    "uprightHeading": "正位置",
    "reversedHeading": "逆位置",
    "loveLabel": "恋愛では",
    "workLabel": "仕事では",
    "sajuHeading": "四柱推命から読むと",
    "relatedHeading": "関連カード",
    "ctaTarot": "今日のカードを引く →",
    "ctaDeck": "デッキ全体を入手 →",
    "backToHub": "← カード解説一覧"
  },
```

`messages/zh-TW.json`:

```json
  "Cards": {
    "metaTitle": "塔羅牌牌義",
    "metaDescription": "每一張牌的意義——正位、逆位，以及用四柱命理來讀。",
    "hubTitle": "牌義解說",
    "hubIntro": "把整副牌讀兩次：一次用塔羅一直以來的讀法，一次用四柱命理。",
    "suitMajor": "大阿爾克那",
    "suitWands": "權杖",
    "suitCups": "聖杯",
    "suitSwords": "寶劍",
    "suitPentacles": "錢幣",
    "meaningHeading": "這張牌的意義",
    "symbolsHeading": "畫中的象徵",
    "uprightHeading": "正位",
    "reversedHeading": "逆位",
    "loveLabel": "在感情上",
    "workLabel": "在工作上",
    "sajuHeading": "用四柱命理來讀",
    "relatedHeading": "相關牌",
    "ctaTarot": "抽今天的牌 →",
    "ctaDeck": "取得整副牌 →",
    "backToHub": "← 全部牌義"
  },
```

- [ ] **Step 2: Run the existing parity test to verify all four match**

Run: `npx vitest run src/i18n/messages-parity.test.ts`
Expected: PASS. A failure here means a key is missing or misspelled in one of the four files — fix it before continuing.

- [ ] **Step 3: Commit**

```bash
git add messages
git commit -m "feat(cards): Cards 메시지 네임스페이스 4개 언어"
```

---

### Task 5: CTA component and its analytics event

The only Client Component in this feature. It exists as a client island for one reason: an untracked Ko-fi CTA cannot be evaluated, so it cannot be improved.

**Files:**
- Modify: `src/lib/analytics.ts` (the `AnalyticsEvent` union)
- Create: `src/components/cards/card-cta.tsx`
- Create: `src/components/cards/card-cta.test.tsx`

**Interfaces:**
- Consumes: `track` from `src/lib/analytics.ts`, `Link` from `src/i18n/navigation.ts`, `useTranslations` from `next-intl`
- Produces: `<CardCta slug={string} />`

- [ ] **Step 1: Write the failing test**

Create `src/components/cards/card-cta.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CardCta } from "./card-cta";

const track = vi.fn();

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [k: string]: unknown }) =>
    <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/lib/analytics", () => ({ track: (...args: unknown[]) => track(...args) }));

describe("CardCta", () => {
  beforeEach(() => track.mockClear());

  it("links to /tarot and to Ko-fi", () => {
    render(<CardCta slug="the-fool" />);
    expect(screen.getByRole("link", { name: "ctaTarot" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "ctaDeck" })).toHaveAttribute(
      "href",
      "https://ko-fi.com/ksaju",
    );
  });

  it("opens the Ko-fi link safely in a new tab", () => {
    render(<CardCta slug="the-fool" />);
    const kofi = screen.getByRole("link", { name: "ctaDeck" });
    expect(kofi).toHaveAttribute("target", "_blank");
    expect(kofi).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("tracks each CTA with its target and slug", () => {
    render(<CardCta slug="the-fool" />);
    fireEvent.click(screen.getByRole("link", { name: "ctaTarot" }));
    expect(track).toHaveBeenCalledWith("card_cta_clicked", { target: "tarot", slug: "the-fool" });

    fireEvent.click(screen.getByRole("link", { name: "ctaDeck" }));
    expect(track).toHaveBeenCalledWith("card_cta_clicked", { target: "kofi", slug: "the-fool" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/cards/card-cta.test.tsx`
Expected: FAIL — `Failed to resolve import "./card-cta"`.

- [ ] **Step 3: Add the event to the analytics union**

In `src/lib/analytics.ts`, add `"card_cta_clicked"` to the `AnalyticsEvent` union, after `"spread_revealed"`:

```ts
  | "spread_revealed"
  | "card_cta_clicked";
```

- [ ] **Step 4: Write the component**

Create `src/components/cards/card-cta.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/analytics";

/**
 * 카드 해설 하단 CTA 2개. 이 기능에서 유일한 클라이언트 컴포넌트로,
 * 이유는 클릭 추적 하나뿐 — 측정 못 하는 Ko-fi 유도는 개선할 수도 없다.
 */
export function CardCta({ slug }: { slug: string }) {
  const t = useTranslations("Cards");

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/tarot"
        onClick={() => track("card_cta_clicked", { target: "tarot", slug })}
        className="flex-1 rounded-xl border border-primary/40 bg-primary/10 px-5 py-4 text-center text-sm font-semibold text-primary transition hover:bg-primary/20"
      >
        {t("ctaTarot")}
      </Link>
      <a
        href="https://ko-fi.com/ksaju"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("card_cta_clicked", { target: "kofi", slug })}
        className="flex-1 rounded-xl border border-accent/40 bg-accent/10 px-5 py-4 text-center text-sm font-semibold text-accent-foreground transition hover:bg-accent/20"
      >
        {t("ctaDeck")}
      </a>
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/cards/card-cta.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/analytics.ts src/components/cards/card-cta.tsx src/components/cards/card-cta.test.tsx
git commit -m "feat(cards): 카드 CTA 2종 + card_cta_clicked 이벤트"
```

---

### Task 6: Article body and related-cards strip

Both are Server Components. `card-guide-article.tsx` renders one `CardGuide`; `related-cards.tsx` renders the internal-link strip.

Minor arcana carry an `element`, so their pages take an oh-haeng accent colour via the existing `ELEMENT_TEXT` map. Major arcana have `element: null` and fall back to the default hanji accent.

**Files:**
- Create: `src/components/cards/card-guide-article.tsx`
- Create: `src/components/cards/related-cards.tsx`
- Create: `src/components/cards/card-guide-article.test.tsx`

**Interfaces:**
- Consumes: `type CardGuide`, `cardSlug`, `relatedCards` from `src/lib/card-guides.ts`; `type TarotCard` from `src/lib/tarot.ts`; `ELEMENT_TEXT` from `src/lib/saju-display.ts`; `getTranslations` from `next-intl/server`; `Link` from `src/i18n/navigation.ts`
- Produces: `<CardGuideArticle card={TarotCard} guide={CardGuide} />`, `<RelatedCards card={TarotCard} />`

- [ ] **Step 1: Write the failing test**

Create `src/components/cards/card-guide-article.test.tsx`:

```tsx
// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardGuideArticle } from "./card-guide-article";
import { TAROT_CARDS } from "@/lib/tarot";
import type { CardGuide } from "@/lib/card-guides";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const guide: CardGuide = {
  title: "The Fool",
  summary: "summary text",
  meaning: ["first paragraph", "second paragraph"],
  symbols: [
    { label: "The mask", text: "mask text" },
    { label: "The bundle", text: "bundle text" },
    { label: "The edge", text: "edge text" },
  ],
  upright: "upright text",
  reversed: "reversed text",
  love: "love text",
  work: "work text",
  sajuLens: "saju lens text",
};

const fool = TAROT_CARDS.find((c) => c.name_en === "The Fool")!;

describe("CardGuideArticle", () => {
  it("renders every section of the guide", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    for (const text of [
      "first paragraph", "second paragraph",
      "mask text", "bundle text", "edge text",
      "upright text", "reversed text",
      "love text", "work text", "saju lens text",
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("renders the saju lens section — the differentiator, never optional", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    expect(screen.getByText("sajuHeading")).toBeInTheDocument();
    expect(screen.getByText("saju lens text")).toBeInTheDocument();
  });

  it("shows the card art with a descriptive alt", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/tarot/major-00-fool.png");
    expect(img).toHaveAttribute("alt", expect.stringContaining("The Fool"));
  });

  it("renders the title as the page h1", async () => {
    render(await CardGuideArticle({ card: fool, guide }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Fool");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/cards/card-guide-article.test.tsx`
Expected: FAIL — `Failed to resolve import "./card-guide-article"`.

- [ ] **Step 3: Write the article component**

Create `src/components/cards/card-guide-article.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import type { TarotCard } from "@/lib/tarot";
import type { CardGuide } from "@/lib/card-guides";
import { ELEMENT_TEXT } from "@/lib/saju-display";

/** 카드 해설 본문. 서버 컴포넌트 — 클라이언트 JS 0. */
export async function CardGuideArticle({
  card,
  guide,
}: {
  card: TarotCard;
  guide: CardGuide;
}) {
  const t = await getTranslations("Cards");
  // 마이너 아르카나는 수트마다 오행이 있어 그 색을 쓴다. 메이저는 element: null → 기본 단청황.
  const accent = card.element ? ELEMENT_TEXT[card.element] : "text-accent";

  return (
    <article className="w-full max-w-2xl space-y-8 text-sm leading-relaxed text-foreground">
      <header className="space-y-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/tarot/${card.filename}`}
          alt={`${card.name_en} (${card.name_kr}) — KSaju tarot card`}
          width={848}
          height={1264}
          loading="lazy"
          className="mx-auto w-full max-w-[280px] rounded-xl border border-border/50 shadow-sm"
        />
        <h1 className="font-display text-3xl font-bold">{guide.title}</h1>
        <p className={`text-xs uppercase tracking-widest ${accent}`}>{card.keywords}</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("meaningHeading")}</h2>
        {guide.meaning.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("symbolsHeading")}</h2>
        <dl className="space-y-3">
          {guide.symbols.map((symbol) => (
            <div key={symbol.label}>
              <dt className={`font-semibold ${accent}`}>{symbol.label}</dt>
              <dd className="text-muted-foreground">{symbol.text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("uprightHeading")}</h2>
        <p>{guide.upright}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("reversedHeading")}</h2>
        <p>{guide.reversed}</p>
      </section>

      <dl className="grid gap-3 rounded-xl border border-border/50 bg-card/50 p-5 sm:grid-cols-2">
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
            {t("loveLabel")}
          </dt>
          <dd className="mt-1">{guide.love}</dd>
        </div>
        <div>
          <dt className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
            {t("workLabel")}
          </dt>
          <dd className="mt-1">{guide.work}</dd>
        </div>
      </dl>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t("sajuHeading")}</h2>
        <p>{guide.sajuLens}</p>
      </section>
    </article>
  );
}
```

- [ ] **Step 4: Write the related-cards component**

Create `src/components/cards/related-cards.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { TarotCard } from "@/lib/tarot";
import { cardSlug, relatedCards } from "@/lib/card-guides";

/** 같은 수트의 발행된 이웃 카드 링크. 발행분이 없으면 아무것도 렌더하지 않는다. */
export async function RelatedCards({ card }: { card: TarotCard }) {
  const related = relatedCards(card);
  if (related.length === 0) return null;

  const t = await getTranslations("Cards");

  return (
    <section className="mt-12 w-full max-w-2xl space-y-3">
      <h2 className="font-display text-lg font-semibold">{t("relatedHeading")}</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {related.map((c) => (
          <li key={c.id}>
            <Link
              href={`/cards/${cardSlug(c)}`}
              className="block rounded-lg border border-border/50 bg-card/50 p-3 text-center text-xs transition hover:border-primary/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/tarot/${c.filename}`}
                alt=""
                width={848}
                height={1264}
                loading="lazy"
                className="mx-auto mb-2 w-full rounded"
              />
              {c.name_en}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/cards/card-guide-article.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/card-guide-article.tsx src/components/cards/related-cards.tsx src/components/cards/card-guide-article.test.tsx
git commit -m "feat(cards): 해설 본문 + 관련 카드 컴포넌트"
```

---

### Task 7: Hub page and card grid

`/cards` lists every published card, grouped by suit. With only The Fool published it shows a single card — that is correct behaviour, not a bug, and it is what the publish gate is for.

**Files:**
- Create: `src/components/cards/card-grid.tsx`
- Create: `src/app/[locale]/cards/page.tsx`

**Interfaces:**
- Consumes: `publishedSlugs`, `cardBySlug`, `cardSlug`, `getGuide` from `src/lib/card-guides.ts`
- Produces: the `/[locale]/cards` route; `<CardGrid locale={Locale} />`

- [ ] **Step 1: Write the grid component**

Create `src/components/cards/card-grid.tsx`:

```tsx
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { TarotCard } from "@/lib/tarot";
import { cardBySlug, cardSlug, getGuide, publishedSlugs } from "@/lib/card-guides";

const SUIT_ORDER = ["major", "wands", "cups", "swords", "pentacles"] as const;
const SUIT_LABEL = {
  major: "suitMajor",
  wands: "suitWands",
  cups: "suitCups",
  swords: "suitSwords",
  pentacles: "suitPentacles",
} as const;

/** 발행된 카드만 수트별로 묶어 보여준다. 미발행 수트 섹션은 통째로 생략. */
export async function CardGrid({ locale }: { locale: Locale }) {
  const t = await getTranslations("Cards");
  const cards = publishedSlugs()
    .map(cardBySlug)
    .filter((c): c is TarotCard => c !== null);

  return (
    <div className="w-full max-w-3xl space-y-10">
      {SUIT_ORDER.map((suit) => {
        const inSuit = cards.filter((c) => c.suit === suit);
        if (inSuit.length === 0) return null;

        return (
          <section key={suit} className="space-y-4">
            <h2 className="font-display text-xl font-semibold">{t(SUIT_LABEL[suit])}</h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {inSuit.map((card) => {
                const slug = cardSlug(card);
                const guide = getGuide(locale, slug);
                return (
                  <li key={card.id}>
                    <Link
                      href={`/cards/${slug}`}
                      className="block rounded-xl border border-border/50 bg-card/50 p-3 transition hover:border-primary/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/tarot/${card.filename}`}
                        alt=""
                        width={848}
                        height={1264}
                        loading="lazy"
                        className="mb-2 w-full rounded"
                      />
                      <span className="block text-center text-xs font-semibold">
                        {guide?.title ?? card.name_en}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Write the hub page**

Create `src/app/[locale]/cards/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { CardGrid } from "@/components/cards/card-grid";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("Cards");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: getPathname({ locale: locale as Locale, href: "/cards" }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href: "/cards" })]),
      ),
    },
  };
}

export default async function CardsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("Cards");

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <header className="mb-10 w-full max-w-3xl space-y-3 text-center">
        <h1 className="font-display text-3xl font-bold">{t("hubTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("hubIntro")}</p>
      </header>
      <CardGrid locale={locale as Locale} />
    </div>
  );
}
```

- [ ] **Step 3: Verify the route builds and renders**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run dev`, open `http://localhost:3000/cards` and `http://localhost:3000/ko/cards`.
Expected: the hub renders with a "Major Arcana" section containing The Fool only, in hanji styling. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/card-grid.tsx "src/app/[locale]/cards/page.tsx"
git commit -m "feat(cards): /cards 허브 + 수트별 그리드"
```

---

### Task 8: Card detail page

**Files:**
- Create: `src/app/[locale]/cards/[slug]/page.tsx`

**Interfaces:**
- Consumes: `publishedSlugs`, `cardBySlug`, `getGuide` from `src/lib/card-guides.ts`; `CardGuideArticle`, `RelatedCards`, `CardCta`
- Produces: the `/[locale]/cards/[slug]` route

- [ ] **Step 1: Write the page**

Create `src/app/[locale]/cards/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { getPathname, Link } from "@/i18n/navigation";
import { cardBySlug, getGuide, publishedSlugs } from "@/lib/card-guides";
import { CardGuideArticle } from "@/components/cards/card-guide-article";
import { RelatedCards } from "@/components/cards/related-cards";
import { CardCta } from "@/components/cards/card-cta";

// 발행 게이트 밖의 슬러그는 요청 시 렌더하지 않고 404.
export const dynamicParams = false;

// 부모 [locale]이 4개 로케일을 만들고, Next가 이 함수를 로케일마다 한 번씩 돌려 교차곱을 만든다.
// 발행 집합은 4개 언어 교집합이라 로케일별로 동일 → 인자 불필요.
export function generateStaticParams() {
  return publishedSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const card = cardBySlug(slug);
  const guide = getGuide(locale as Locale, slug);
  if (!card || !guide) return {};

  const href = `/cards/${slug}`;
  return {
    // 루트 layout의 template이 " · KSaju"를 붙인다. 타겟 검색어를 맨 앞에 둔다.
    title: `${card.name_en} Tarot Card Meaning`,
    description: guide.summary,
    alternates: {
      canonical: getPathname({ locale: locale as Locale, href }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ locale: l, href })]),
      ),
    },
    openGraph: {
      type: "article",
      title: `${card.name_en} Tarot Card Meaning`,
      description: guide.summary,
      images: [{ url: `/tarot/${card.filename}`, width: 848, height: 1264, alt: card.name_en }],
    },
    twitter: {
      // 카드 아트가 세로 비율이라 large image가 아니라 summary.
      card: "summary",
      title: `${card.name_en} Tarot Card Meaning`,
      description: guide.summary,
      images: [`/tarot/${card.filename}`],
    },
  };
}

export default async function CardGuidePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const card = cardBySlug(slug);
  const guide = getGuide(locale as Locale, slug);
  if (!card || !guide) notFound();

  const t = await getTranslations("Cards");
  const base = "https://ksaju.me";
  const url = `${base}${getPathname({ locale: locale as Locale, href: `/cards/${slug}` })}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${card.name_en} Tarot Card Meaning`,
        description: guide.summary,
        image: `${base}/tarot/${card.filename}`,
        inLanguage: locale,
        mainEntityOfPage: url,
        isPartOf: { "@type": "WebSite", name: "KSaju", url: base },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "KSaju", item: base },
          {
            "@type": "ListItem",
            position: 2,
            name: t("hubTitle"),
            item: `${base}${getPathname({ locale: locale as Locale, href: "/cards" })}`,
          },
          { "@type": "ListItem", position: 3, name: guide.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="flex flex-1 flex-col items-center px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CardGuideArticle card={card} guide={guide} />
      <div className="w-full max-w-2xl">
        <CardCta slug={slug} />
      </div>
      <RelatedCards card={card} />
      <Link
        href="/cards"
        className="mt-12 text-sm text-primary underline-offset-2 hover:underline"
      >
        {t("backToHub")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Verify the route builds static**

Run: `npx tsc --noEmit && npm run build`
Expected: the build output lists `/[locale]/cards` and `/[locale]/cards/[slug]` with the static marker (`●` / `○`), and shows `/cards/the-fool` among the prerendered paths for each locale.

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000/cards/the-fool` and `http://localhost:3000/ja/cards/the-fool`.
Expected: art, all sections, both CTAs, back link. `http://localhost:3000/cards/the-magician` returns 404 (not yet published). View source and confirm the `<script type="application/ld+json">` block and the `hreflang` alternates are present. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/cards/[slug]/page.tsx"
git commit -m "feat(cards): 카드 상세 페이지 + hreflang/JSON-LD 메타데이터"
```

---

### Task 9: Sitemap, footer link, and the `/tarot` fix

`src/app/sitemap.ts` currently lists only `/` and `/inyeon` as core routes — **`/tarot` has never been in the sitemap**, so the tarot feature has been invisible to crawlers since it shipped. This task rewrites that file anyway, so the omission is fixed here.

The count assertion is computed from `publishedSlugs()` rather than hardcoded, so it will not need editing again when the remaining 56 cards land.

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/sitemap.test.ts`
- Modify: `src/components/layout/site-footer.tsx`
- Modify: `src/components/layout/site-footer.test.tsx`
- Modify: `messages/en.json`, `messages/ko.json`, `messages/ja.json`, `messages/zh-TW.json` (one `SiteFooter` key)
- Modify: `src/components/tarot/tarot-view.tsx`

**Interfaces:**
- Consumes: `publishedSlugs` from `src/lib/card-guides.ts`
- Produces: no new exports

- [ ] **Step 1: Write the failing sitemap test**

In `src/app/sitemap.test.ts`, add the import at the top:

```ts
import { publishedSlugs } from "@/lib/card-guides";
```

Replace the existing `"총 24개 URL"` test with:

```ts
  it("타로 라우트 4 locale 포함 (사이트맵에서 누락돼 있던 버그)", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/tarot");
    expect(urls).toContain("https://ksaju.me/ko/tarot");
    expect(urls).toContain("https://ksaju.me/ja/tarot");
    expect(urls).toContain("https://ksaju.me/zh-TW/tarot");
  });

  it("카드 허브 4 locale 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/cards");
    expect(urls).toContain("https://ksaju.me/ko/cards");
  });

  it("발행된 카드만 4 locale로 포함", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://ksaju.me/cards/the-fool");
    expect(urls).toContain("https://ksaju.me/zh-TW/cards/the-fool");
    // 미발행 카드는 절대 나오면 안 된다 — 크롤러에게 404를 먹이는 셈이 된다.
    for (const url of urls) {
      const match = url.match(/\/cards\/([a-z0-9-]+)$/);
      if (match) expect(publishedSlugs()).toContain(match[1]);
    }
  });

  it("총 URL = 4 locale × (4 코어 + 4 trust) + 발행 카드 × 4", () => {
    expect(sitemap()).toHaveLength(32 + publishedSlugs().length * 4);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: FAIL — `/tarot`, `/cards`, and the card URLs are all missing.

- [ ] **Step 3: Rewrite the sitemap**

Replace `src/app/sitemap.ts` entirely:

```ts
import type { MetadataRoute } from "next";
import { publishedSlugs } from "@/lib/card-guides";

const BASE = "https://ksaju.me";
const LOCALES = ["en", "ja", "ko", "zh-TW"] as const;
const CORE_ROUTES = ["/", "/inyeon", "/tarot", "/cards"] as const;
const TRUST_ROUTES = ["/about", "/faq", "/privacy", "/terms"] as const;

/** en은 prefix 없음(localePrefix: 'as-needed'), 나머지는 /<locale> prefix. */
function url(locale: string, route: string): string {
  if (locale === "en") return route === "/" ? `${BASE}/` : `${BASE}${route}`;
  return route === "/" ? `${BASE}/${locale}/` : `${BASE}/${locale}${route}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const core = LOCALES.flatMap((locale) =>
    CORE_ROUTES.map((route) => ({ url: url(locale, route), lastModified })),
  );

  const trust = LOCALES.flatMap((locale) =>
    TRUST_ROUTES.map((route) => ({ url: url(locale, route), lastModified })),
  );

  // 발행 게이트를 그대로 따라간다 — 라우팅되지 않는 카드는 사이트맵에도 없다.
  const cards = LOCALES.flatMap((locale) =>
    publishedSlugs().map((slug) => ({ url: url(locale, `/cards/${slug}`), lastModified })),
  );

  return [...core, ...trust, ...cards];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/sitemap.test.ts`
Expected: PASS

- [ ] **Step 5: Add the footer link (failing test first)**

In `src/components/layout/site-footer.test.tsx`, add `[/cards/i, "/cards"]` to the `expected` array so it reads:

```ts
    const expected: Array<[RegExp, string]> = [
      [/cards/i, "/cards"],
      [/about/i, "/about"],
      [/faq/i, "/faq"],
      [/privacy/i, "/privacy"],
      [/terms/i, "/terms"],
    ];
```

Run: `npx vitest run src/components/layout/site-footer.test.tsx`
Expected: FAIL — no link named `/cards/i`.

- [ ] **Step 6: Add the link and its label**

In `src/components/layout/site-footer.tsx`, add as the **first** item inside `<nav>`, before the About link:

```tsx
        <Link href="/cards" className="underline-offset-2 hover:underline hover:text-foreground">
          {t("cards")}
        </Link>
```

Add a `"cards"` key to the `SiteFooter` namespace in each message file:

- `messages/en.json`: `"cards": "Card meanings",`
- `messages/ko.json`: `"cards": "카드 해설",`
- `messages/ja.json`: `"cards": "カード解説",`
- `messages/zh-TW.json`: `"cards": "牌義解說",`

Run: `npx vitest run src/components/layout/site-footer.test.tsx src/i18n/messages-parity.test.ts`
Expected: PASS

- [ ] **Step 7: Link the hub from `/tarot`**

`src/components/tarot/tarot-view.tsx` imports `Link` from `next/link`, which is **not**
locale-aware — a plain `/cards` href would drop a `ko` reader back to the English page.
Import the locale-aware one under an alias instead, the way `about/page.tsx` already does.

Add to the imports:

```tsx
import { Link as LocaleLink } from "@/i18n/navigation";
```

Then find the existing spread CTA (around line 68, the `<Link href="/tarot/spread">` that
renders `t("spreadCta")`) and add a sibling directly beneath it, matching its classes:

```tsx
        <LocaleLink
          href="/cards"
          className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("cardsCta")}
        </LocaleLink>
```

Leave the existing `next/link` import and the spread link untouched.

Add a `"cardsCta"` key to the `Tarot` namespace in each message file:

- `messages/en.json`: `"cardsCta": "Read what every card means →",`
- `messages/ko.json`: `"cardsCta": "카드별 의미 읽어보기 →",`
- `messages/ja.json`: `"cardsCta": "各カードの意味を読む →",`
- `messages/zh-TW.json`: `"cardsCta": "閱讀每張牌的意義 →",`

- [ ] **Step 8: Run the full suite**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all green. Existing warnings that were already present before this cycle are acceptable; new ones are not.

- [ ] **Step 9: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts src/components/layout/site-footer.tsx src/components/layout/site-footer.test.tsx src/components/tarot/tarot-view.tsx messages
git commit -m "feat(cards): 사이트맵에 /cards 추가 + 누락됐던 /tarot 수정 + 내부 링크"
```

---

### Task 10: Draft generator script

A build-time authoring tool, following the existing `scripts/seed-*.mjs` pattern. It never runs in the app.

It reads `card_prompt` from `docs/tarot-cards.csv` — the art-direction prompt the deck images were generated from — so the `symbols` field describes what is genuinely on the card instead of inventing imagery. It also passes the hand-written The Fool entry as a style exemplar so the other cards match the house voice.

**Files:**
- Create: `scripts/draft-card-guides.mjs`
- Modify: `package.json` (one script entry)

**Interfaces:**
- Consumes: `data/ksaju-tarot.json`, `docs/tarot-cards.csv`, `data/card-guides/*.json`, `OPENROUTER_API_KEY`
- Produces: writes to `data/card-guides/<locale>.json`

- [ ] **Step 1: Write the script**

Create `scripts/draft-card-guides.mjs`:

```js
// data/card-guides/<locale>.json 초안 생성기. 1회성 저작 도구 — 앱에서는 절대 실행되지 않는다.
//
//   npm run draft:cards -- --lang en --suit major
//   npm run draft:cards -- --lang ko,ja,zh-TW --suit major
//   npm run draft:cards -- --lang ko --force the-fool
//
// 이미 채워진 슬러그는 건너뛴다(idempotent). 손질한 본문을 덮어쓰지 않고, 중단해도 이어서 돌릴 수 있다.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cards = JSON.parse(readFileSync(join(root, "data", "ksaju-tarot.json"), "utf8"));
const guideDir = join(root, "data", "card-guides");
const MODEL = "anthropic/claude-haiku-4-5-20251001";
const LOCALES = ["en", "ko", "ja", "zh-TW"];
const LANG_NAME = { en: "English", ko: "Korean", ja: "Japanese", "zh-TW": "Traditional Chinese (Taiwan)" };
const FIELDS = ["title", "summary", "meaning", "symbols", "upright", "reversed", "love", "work", "sajuLens"];

// ---------- CLI ----------
function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}
const langs = (arg("lang", "en")).split(",").map((s) => s.trim());
const suit = arg("suit", "major");
const force = arg("force");
for (const l of langs) if (!LOCALES.includes(l)) throw new Error(`Unknown locale: ${l}`);

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY is not set. Export it and re-run.");
  process.exit(1);
}

// ---------- card_prompt: 그림에 실제로 그려진 것 ----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length > 1);
}
const csvRows = parseCsv(readFileSync(join(root, "docs", "tarot-cards.csv"), "utf8"));
const csvHeader = csvRows[0];
const promptByName = new Map(
  csvRows.slice(1).map((r) => [r[csvHeader.indexOf("name_en")], r[csvHeader.indexOf("card_prompt")]]),
);

// ---------- slug (src/lib/card-guides.ts 의 cardSlug 와 동일 규칙) ----------
const slugOf = (card) =>
  card.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ---------- 파일 I/O ----------
function loadGuides(locale) {
  const path = join(guideDir, `${locale}.json`);
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : {};
}
function saveGuides(locale, guides) {
  mkdirSync(guideDir, { recursive: true });
  // 카드 id 순으로 정렬해 diff를 읽을 수 있게 유지한다.
  const ordered = {};
  for (const card of cards) {
    const s = slugOf(card);
    if (guides[s]) ordered[s] = guides[s];
  }
  writeFileSync(join(guideDir, `${locale}.json`), JSON.stringify(ordered, null, 2) + "\n", "utf8");
}

// ---------- 검증: 통과 못 하면 그 카드는 저장하지 않는다 ----------
// summary 길이는 로케일마다 다르다. CJK 한 글자가 라틴 문자보다 훨씬 많은 정보를 담아서,
// 같은 내용의 한국어 요약은 영어의 절반도 안 되는 글자 수로 끝난다.
// 구글이 메타 설명을 자르는 지점(약 920px)도 라틴 ~155자 / CJK ~65자로 갈린다.
// 여기에 영어 기준(120-200)을 그대로 적용하면 번역본이 전부 검증 실패한다.
const SUMMARY_RANGE = { en: [120, 200], ko: [45, 90], ja: [45, 90], "zh-TW": [40, 85] };

function validate(guide, slug, locale) {
  for (const f of FIELDS) if (guide[f] === undefined) throw new Error(`${slug}: missing ${f}`);
  if (!Array.isArray(guide.meaning) || guide.meaning.length < 2) throw new Error(`${slug}: meaning needs 2+ paragraphs`);
  if (!Array.isArray(guide.symbols) || guide.symbols.length < 3) throw new Error(`${slug}: symbols needs 3+ entries`);
  for (const s of guide.symbols) {
    if (!s.label?.trim() || !s.text?.trim()) throw new Error(`${slug}: symbol missing label/text`);
  }
  const [min, max] = SUMMARY_RANGE[locale];
  if (guide.summary.length < min || guide.summary.length > max) {
    throw new Error(`${slug}: summary is ${guide.summary.length} chars, need ${min}-${max} for ${locale}`);
  }
  for (const f of ["title", "upright", "reversed", "love", "work", "sajuLens"]) {
    if (!String(guide[f]).trim()) throw new Error(`${slug}: ${f} is blank`);
  }
  return guide;
}

async function ask(system, user) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return JSON.parse(body.choices[0].message.content);
}

const shapeFor = (locale) => `Return ONE JSON object with exactly these keys:
{
  "title": string,
  "summary": string (${SUMMARY_RANGE[locale][0]}-${SUMMARY_RANGE[locale][1]} characters — this is a meta description, and the limit differs by language because CJK characters carry more per glyph),
  "meaning": [string, string]  (2 paragraphs, 60-90 words each),
  "symbols": [{"label": string, "text": string}] (3-4 entries, 30-50 words each),
  "upright": string (3-4 sentences),
  "reversed": string (3 sentences),
  "love": string (one sentence),
  "work": string (one sentence),
  "sajuLens": string (one paragraph, 80-110 words)
}
No markdown, no extra keys, no commentary.`;

const VOICE = `You write for KSaju, a Korean saju and tarot site for an international audience.
Voice: plain, specific, quietly witty. Short sentences. No mysticism-for-its-own-sake,
no "the universe wants you to", no second-person life advice that could apply to anyone.
Never claim accuracy or real divination — the site's disclaimer is "For entertainment".
Write about this specific card, not about tarot in general.

CRITICAL — "symbols" must describe imagery that is ACTUALLY DRAWN on this card. You are
given the art-direction prompt the illustration was generated from. Use only what it
contains. Do not invent objects, animals, or colours that are not in it.

CRITICAL — "sajuLens" is what makes this page worth existing. Connect the card to the
five elements (오행: wood/fire/earth/metal/water) and to the 일간 (Day Master) concept.
Say how the card reads differently for someone whose Day Master is one element versus
another. Be concrete.`;

async function draftEnglish(card, exemplar) {
  const system = `${VOICE}\n\n${shapeFor("en")}`;
  const user = `Write the English guide for this tarot card.

name_en: ${card.name_en}
name_kr: ${card.name_kr}
suit: ${card.suit}
rank: ${card.rank}
element: ${card.element ?? "none (Major Arcana)"}
theme: ${card.theme}
keywords: ${card.keywords}

Art-direction prompt the illustration was generated from (the ONLY source for "symbols"):
${promptByName.get(card.name_en) ?? "(unavailable — describe symbols only in general terms)"}

Here is an existing entry in the exact voice and shape to match:
${JSON.stringify(exemplar, null, 2)}`;
  return ask(system, user);
}

async function translate(card, source, locale) {
  const system = `You are a literary translator working into ${LANG_NAME[locale]}.
Translate faithfully but idiomatically — the result must read as if written in
${LANG_NAME[locale]}, not translated. Keep every nuance and the dry, specific tone.
Keep Korean terms 사주, 일간, 오행 and element names in the target language's normal
convention. Keep the card's English name somewhere in "title".

Do NOT pad "summary" to match the English length — a natural ${LANG_NAME[locale]} summary
of the same content is much shorter in characters. Aim for the range below.

${shapeFor(locale)}`;
  const user = `Translate this tarot card guide into ${LANG_NAME[locale]}.
The card is ${card.name_en} (${card.name_kr}).

${JSON.stringify(source, null, 2)}`;
  return ask(system, user);
}

// ---------- main ----------
const targets = cards.filter((c) => c.suit === suit);
const en = loadGuides("en");
const exemplar = en["the-fool"];
if (!exemplar) throw new Error("data/card-guides/en.json must contain 'the-fool' as the style exemplar.");

for (const locale of langs) {
  const guides = loadGuides(locale);
  let written = 0, skipped = 0, failed = 0;

  for (const card of targets) {
    const slug = slugOf(card);
    if (force && slug !== force) continue;
    if (guides[slug] && slug !== force) { skipped++; continue; }

    try {
      const raw = locale === "en"
        ? await draftEnglish(card, exemplar)
        : await translate(card, en[slug] ?? (() => { throw new Error(`en.json has no '${slug}' to translate from — draft English first`); })(), locale);
      guides[slug] = validate(raw, slug, locale);
      saveGuides(locale, guides);   // 카드마다 저장 — 중단돼도 진행분이 남는다
      written++;
      console.log(`  ✓ ${locale}/${slug}`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${locale}/${slug}: ${err.message}`);
    }
  }

  console.log(`${locale}: ${written} written, ${skipped} skipped, ${failed} failed`);
}
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"` after `"seed:tarot"`:

```json
    "draft:cards": "node scripts/draft-card-guides.mjs",
```

- [ ] **Step 3: Verify the guard rails without spending tokens**

Run: `node scripts/draft-card-guides.mjs --lang en --suit major`
Expected (with `OPENROUTER_API_KEY` unset): exits with `OPENROUTER_API_KEY is not set.` and status 1.

Run with the key set: it should print `✓` lines for the 21 unwritten majors and skip `the-fool`. Confirm `the-fool` is reported as skipped — that proves the idempotency guard works before it is trusted with hand-edited prose.

- [ ] **Step 4: Commit**

```bash
git add scripts/draft-card-guides.mjs package.json
git commit -m "feat(cards): 해설 초안 2단계 생성기(영어 원본 → 번역)"
```

---

### Task 11: Draft, review, and publish the Major Arcana

The only task with a human review step that cannot be automated. The publish gate means nothing goes live until all four locales are complete, so it is safe to stop partway.

**Files:**
- Modify: `data/card-guides/en.json`, `ko.json`, `ja.json`, `zh-TW.json`

- [ ] **Step 1: Draft the 21 remaining English guides**

Run: `npm run draft:cards -- --lang en --suit major`
Expected: 21 written, 1 skipped (`the-fool`), 0 failed. Re-run for any failures — completed cards are skipped.

- [ ] **Step 2: Review the English content**

Read `data/card-guides/en.json` end to end. Check specifically:

- Does `symbols` describe imagery actually on the card? Cross-check a few against the `card_prompt` column of `docs/tarot-cards.csv` and against the PNG in `public/tarot/`. **Invented imagery is the highest-risk failure here** — it makes the page factually wrong about its own illustration.
- Does `sajuLens` say something specific about 오행 and 일간, or has it drifted into generic filler? This field is the reason the page can rank at all.
- Any claim of accuracy or real divination? Remove it.
- Does every card sound distinct, or did several converge on the same sentences?

Edit anything that fails. Hand edits are safe — the generator skips written slugs.

- [ ] **Step 3: Translate into the other three locales**

Run: `npm run draft:cards -- --lang ko,ja,zh-TW --suit major`
Expected: 22 written per locale, 0 failed.

- [ ] **Step 4: Review the Korean output**

Read `data/card-guides/ko.json`. It is the locale you can verify directly. Confirm it reads as Korean prose rather than translated English, and that 오행/일간 terminology is used naturally.

For `ja` and `zh-TW`, spot-check that no English or Korean text leaked through and that no field is empty. If you cannot vouch for the quality of a locale at all, say so before shipping — the publish gate makes narrowing to `en` + `ko` a one-line change to `GUIDES` in `src/lib/card-guides.ts`, and shipping two good languages beats shipping four unverifiable ones.

- [ ] **Step 5: Run the full verification**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected:
- All tests pass. The parity test now covers 22 cards × 4 locales.
- `tsc` clean.
- `lint` clean apart from warnings that pre-date this cycle.
- Build shows `/[locale]/cards` and `/[locale]/cards/[slug]` as static, with 88 prerendered card paths.

- [ ] **Step 6: Verify the sitemap in a running build**

Run: `npm run start` (after the build), then open `http://localhost:3000/sitemap.xml`.
Expected: 120 URLs — 4 locales × (4 core + 4 trust) = 32, plus 22 cards × 4 = 88. Confirm `/tarot` is present and no unpublished card appears.

- [ ] **Step 7: Commit**

```bash
git add data/card-guides
git commit -m "content(cards): 메이저 아르카나 22장 해설 4개 언어"
```

---

## Post-implementation

**Deployment:** nothing new is required. No environment variables, no database migration, no external service. `OPENROUTER_API_KEY` is needed only to run the generator locally and is already configured for the tarot reading API.

**After deploy:**
1. Submit the updated sitemap in Google Search Console.
2. Give indexing a few weeks before drawing conclusions about traffic.
3. Watch `card_cta_clicked` in PostHog, split by `target`, to see whether Ko-fi conversion is real.

**Next cycle candidate:** the 56 Minor Arcana. Run `npm run draft:cards -- --lang en --suit wands` (then `cups`, `swords`, `pentacles`), review, translate. No code changes — the publish gate routes them automatically once all four locales have them.
