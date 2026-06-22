# Apps in Toss 미니앱 (K사주) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 KSaju 사주 엔진을 재사용해, 앱인토스 WebView 미니앱(K사주)을 독립 Vite SPA로 구현한다 — 한국어 전용·외부통신 0·오프라인 결정적.

**Architecture:** `apps-in-toss/` 폴더에 자체 package.json 을 둔 독립 Vite+React SPA. 기존 `src/lib` 순수 로직 엔진과 `data/*.json` 을 **복사**(크로스 import 없음)하고, `saju.ts` 의 `server-only` 가드만 제거해 manseryeok 을 브라우저에서 직접 돌린다. LLM/Supabase/분석/외부링크는 전부 제거하고, 리딩은 엔진의 `locale="ko"` 경로 + 소규모 한국어 콘텐츠 보강으로 처리한다. 화면 전환은 라우터 의존성 없이 App 레벨 `useState` + 탭 네비.

**Tech Stack:** Vite, React, TypeScript, Tailwind v4, `@apps-in-toss/web-framework`, `@fullstackfamily/manseryeok`, date-fns-tz, zod, react-hook-form, motion, html-to-image, vitest + @testing-library/react + happy-dom.

## Global Constraints

모든 태스크의 요구사항에 암묵적으로 포함된다.

- **한국어 전용 UI.** 로케일 지원 엔진(`calcFortune`, `getReading`, `elementLabel`, 타로 리딩)에는 **항상 `locale="ko"`** 를 넘긴다. 새 문자열은 한국어로 작성.
- **외부통신/링크 0.** Supabase·PostHog·Vercel Analytics·OpenRouter(LLM)·QR(gen-qr)·ksaju.me 링크·ko-fi 후원 링크·공유 카드 URL 워터마크 — 전부 금지. fetch/외부 도메인 호출 없음.
- **오프라인·결정적.** 같은 입력 → 항상 같은 출력(타로 스프레드의 의도된 랜덤 제외). API 키 불필요.
- **라이트 한지 테마 전용.** next-themes·다크모드 토글 없음.
- **primaryColor `#C8385A` (진달래).** granite.config 와 Tailwind 토큰 동일.
- **완전 독립.** `apps-in-toss/` 는 자체 node_modules. 레포 루트 `src/` 를 import 하지 않는다(복사만).
- **TDD · 잦은 커밋.** 각 태스크는 독립 테스트 가능한 산출물로 끝나고 커밋한다.

### 재사용 엔진 시그니처 (복사 후 `apps-in-toss/src/lib/` 기준)

```ts
// saju.ts (server-only 제거)
birthToSaju(birth: BirthData): UserSaju
dateToLuck(now: Date): CurrentLuck
toCompatPillars(saju: UserSaju): SajuPillars
// compatibility.ts
calcCompatibility(me: SajuPillars, idol: SajuPillars): CompatibilityResult  // {score,label(EN),breakdown}
normalizeIdolSaju(saju: {year:{hanja};month:{hanja};day:{hanja}}): SajuPillars
// fortune.ts
calcFortune(userSaju: UserSaju, luck: CurrentLuck, locale="ko"): FortuneCard[]  // [money,love,career,time]
// reading.ts
getReading(mePillars: SajuPillars, otherPillars: SajuPillars, score: number, locale="ko"): string
// tarot.ts
drawDailyCard(saju: UserSaju, dateStr: string): TarotCard
kstDateString(now?: Date): string
drawSpread(rng?: () => number): [TarotCard, TarotCard, TarotCard]
// idols.ts
groups: string[]; idols: Idol[]
getIdolsByGroup(group: string): Idol[]
searchIdols(query: string): Idol[]
// saju-display.ts
wuxingBalance(saju: UserSaju): Record<WuXing, number>
dayMasterInfo(dm: string): { char; element: WuXing; keyword: string /* EN */ }
elementOf(char): WuXing; elementLabel(el, "ko"): string
WUXING_META; WUXING_KO; ELEMENT_TEXT; pillarKo(p): string; pillarBreakdown(p)
// types: BirthData (kst-types), birthSchema (zod), UserSaju/CurrentLuck/WuXing (saju-types),
//        SajuPillars (compatibility), FortuneCard (fortune), TarotCard (tarot), Idol (idols)
```

### 한국어 콘텐츠 갭 (엔진이 영어로만 내보내는 부분 → 보강 대상)

- `calcCompatibility().label` — 영어. → Task 3 `compatLabelKo`.
- `dayMasterInfo().keyword` (`DAY_MASTER_KEYWORDS`) — 영어. → Task 3 `dayMasterKeywordKo`.
- 타로 리딩 — 엔진 fallback 의 ko 분기는 존재하나 `card.theme`(영어)를 섞음. → Task 4 에서 영어 theme 미사용 한국어 composer.

---

## Task 1: Vite 스캐폴딩 + 프레임워크 + 한지 테마 셸

**Files:**
- Create: `apps-in-toss/package.json`, `apps-in-toss/vite.config.ts`, `apps-in-toss/tsconfig.json`, `apps-in-toss/index.html`
- Create: `apps-in-toss/granite.config.ts`
- Create: `apps-in-toss/postcss.config.mjs`, `apps-in-toss/src/globals.css`
- Create: `apps-in-toss/src/main.tsx`, `apps-in-toss/src/App.tsx`
- Create: `apps-in-toss/vitest.config.ts`, `apps-in-toss/src/test-setup.ts`
- Test: `apps-in-toss/src/App.test.tsx`

**Interfaces:**
- Produces: `App` (default export, 한지 셸 + "K사주" 헤더 렌더). 후속 태스크가 화면을 끼워 넣음.

- [ ] **Step 1: Vite 프로젝트 생성 + 프레임워크 설치**

```bash
cd apps-in-toss   # 폴더는 git 루트 하위. 없으면 mkdir.
npm create vite@latest . -- --template react-ts
npm install
npm install @apps-in-toss/web-framework @fullstackfamily/manseryeok date-fns date-fns-tz zod react-hook-form @hookform/resolvers motion html-to-image clsx tailwind-merge
npm install -D tailwindcss @tailwindcss/postcss vitest happy-dom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npx ait init   # granite.config.ts 생성(아래 Step 2에서 값 교체)
```

- [ ] **Step 2: `granite.config.ts` 작성**

```ts
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ksaju',                 // 콘솔 등록 App ID(배포 시 확정)
  brand: {
    displayName: 'K사주',
    primaryColor: '#C8385A',        // 진달래 핑크
    icon: 'https://static.toss.im/icons/png/4x/icon-star.png', // 콘솔 업로드 후 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: { dev: 'vite', build: 'tsc -b && vite build' },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: { type: 'partner' },
});
```

- [ ] **Step 3: Tailwind v4 + 한지 토큰 (`src/globals.css`)**

라이트 모드 토큰만 가져온다(레포 `src/app/globals.css` 라이트 블록 미러).

```css
@import "tailwindcss";

@theme {
  --color-hanji:     #FBF6E8;
  --color-baekja:    #FFFFFF;
  --color-muk:       #1A1A2E;
  --color-jindallae: #C8385A;
  --color-dancheong: #C49A3F;
  --color-cheongja:  #88B0BC;
  --color-wuxing-mok:  #5E8B5E;
  --color-wuxing-hwa:  var(--color-jindallae);
  --color-wuxing-to:   var(--color-dancheong);
  --color-wuxing-geum: #A8A8B0;
  --color-wuxing-su:   var(--color-cheongja);
}

:root { color-scheme: light; }
body { background: var(--color-hanji); color: var(--color-muk); }
```

`postcss.config.mjs`:

```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`index.html` 의 `<body>` 직전 `<title>K사주</title>`, `src/main.tsx` 에서 `import "./globals.css"`.

- [ ] **Step 4: vitest 설정**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: { environment: "happy-dom", globals: true, setupFiles: ["./src/test-setup.ts"] },
});
```

`src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`package.json` scripts 에 `"test": "vitest run"` 추가.

- [ ] **Step 5: 실패 테스트 작성 (`src/App.test.tsx`)**

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

test("앱 셸이 K사주 헤더를 렌더한다", () => {
  render(<App />);
  expect(screen.getByRole("banner")).toHaveTextContent("K사주");
});
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `App` 가 헤더를 렌더하지 않음.

- [ ] **Step 7: `src/App.tsx` 최소 구현**

```tsx
export default function App() {
  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 text-lg font-bold text-[var(--color-jindallae)]">
        K사주
      </header>
      <main className="px-4 pb-24" />
    </div>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>
);
```

- [ ] **Step 8: 테스트 통과 + dev 서버 확인**

Run: `npm test` → PASS. 그리고 `npm run dev` → http://localhost:5173 에서 한지 배경 + "K사주" 헤더 확인.

- [ ] **Step 9: 커밋**

```bash
git add apps-in-toss
git commit -m "feat(toss): Vite 스캐폴딩 + granite.config + 한지 테마 셸"
```

---

## Task 2: 엔진 libs + data 이식 (manseryeok 클라이언트 검증)

**Files:**
- Create: `apps-in-toss/src/lib/` — 레포 `src/lib/` 에서 복사:
  `saju.ts`, `saju-data.ts`, `saju-types.ts`, `saju-display.ts`, `kst-converter.ts`,
  `kst-data.ts`, `kst-types.ts`, `compatibility.ts`, `fortune.ts`, `reading.ts`,
  `tarot.ts`, `idols.ts`, `utils.ts`
- Create: `apps-in-toss/src/data/` — 레포 `data/` 에서 복사:
  `ksaju-idol-db.json`, `ksaju-tarot.json`, `ksaju-readings.json`, `ksaju-fortune-i18n.json`
- Modify: `apps-in-toss/src/lib/saju.ts` (server-only 제거)
- Modify: 복사한 libs 의 데이터 import 경로 (`../../data/` → `../data/`)
- Test: `apps-in-toss/src/lib/saju.test.ts`

**Interfaces:**
- Produces: 위 Global Constraints 의 재사용 엔진 시그니처 일체.

- [ ] **Step 1: 파일 복사**

```bash
cd /c/temp/Playground/ksaju
cp src/lib/{saju,saju-data,saju-types,saju-display,kst-converter,kst-data,kst-types,compatibility,fortune,reading,tarot,idols,utils}.ts apps-in-toss/src/lib/
mkdir -p apps-in-toss/src/data
cp data/{ksaju-idol-db,ksaju-tarot,ksaju-readings,ksaju-fortune-i18n}.json apps-in-toss/src/data/
```

- [ ] **Step 2: `saju.ts` 에서 server-only 제거**

`apps-in-toss/src/lib/saju.ts` 의 `import "server-only";` 줄을 삭제한다. (manseryeok·date-fns-tz 는 브라우저 동작 — `server-only` 는 번들 크기 가드였을 뿐.)

- [ ] **Step 3: 데이터 import 경로 수정**

복사된 libs 에서 `../../data/` 를 `../data/` 로 바꾼다. 대상:
- `fortune.ts`: `import i18n from "../../data/ksaju-fortune-i18n.json";` → `"../data/ksaju-fortune-i18n.json"`
- `reading.ts`: `import readings from "../../data/ksaju-readings.json";` → `"../data/..."`
- `tarot.ts`: `import tarot from "../../data/ksaju-tarot.json";` → `"../data/..."`
- `idols.ts`: idol-db import 경로 → `"../data/ksaju-idol-db.json"`

`tsconfig.json` 에 `"resolveJsonModule": true`, `"esModuleInterop": true` 가 있는지 확인(Vite 기본 포함).

- [ ] **Step 4: 실패 테스트 작성 (`src/lib/saju.test.ts`)**

RM(김남준) known-answer — 레포 `src/lib/saju.test.ts` 패턴 이식. manseryeok 이 브라우저(happy-dom) 환경에서 동작함을 증명한다.

```ts
import { birthToSaju } from "./saju";
import type { BirthData } from "./kst-types";

test("RM 생일 → 아이돌 DB와 일치하는 4기둥", () => {
  const birth: BirthData = {
    year: 1994, month: 9, day: 12, hour: null, minute: null,
    timezone: "Asia/Seoul",
  };
  const saju = birthToSaju(birth);
  expect(saju.pillars.year).toBe("甲戌");
  expect(saju.pillars.day).toBe("辛卯");
  expect(saju.dayMaster).toBe("辛");
});
```

> 참고: 정확한 기대 한자는 레포 `src/lib/saju.test.ts` 의 RM 케이스에서 그대로 복사할 것. `BirthData` 필드는 복사된 `kst-types.ts` 의 정의에 맞춘다.

- [ ] **Step 5: 테스트 실패 확인**

Run: `npm test src/lib/saju.test.ts`
Expected: FAIL(또는 import 에러) — 경로/구현 미정비 시.

- [ ] **Step 6: 통과시키기**

Step 2-3 이 끝나면 통과. import 에러가 남으면 경로를 정비한다.

Run: `npm test src/lib/saju.test.ts`
Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add apps-in-toss/src/lib apps-in-toss/src/data
git commit -m "feat(toss): 사주/궁합/운세/타로 엔진 + 데이터 이식, server-only 제거"
```

---

## Task 3: 한국어 콘텐츠 — 궁합 레이블 + 일간 키워드

**Files:**
- Create: `apps-in-toss/src/content/ko/labels.ts`
- Test: `apps-in-toss/src/content/ko/labels.test.ts`

**Interfaces:**
- Consumes: `elementOf` (saju-display)
- Produces:
  - `compatLabelKo(meDayStem: string, idolDayStem: string): string`
  - `dayMasterKeywordKo(dayStem: string): string`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { compatLabelKo, dayMasterKeywordKo } from "./labels";

test("화×수 조합은 뜨겁고 차가운 케미 레이블", () => {
  // 丙(화) × 壬(수)
  expect(compatLabelKo("丙", "壬")).toBe("뜨겁고 차가운 케미 🔥💧");
});

test("미지정 조합은 기본 레이블", () => {
  // 甲(목) × 甲(목) 은 정의돼 있으므로, 정의된 키 전체가 동작함을 확인
  expect(compatLabelKo("甲", "甲")).toBe("나란히 자라는 사이 🌳🌳");
});

test("일간 辛 → 음금 키워드(한국어)", () => {
  expect(dayMasterKeywordKo("辛")).toContain("음금");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/content/ko/labels.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

`compatibility.ts` 의 `funLabel` 키(`[e1,e2].sort().join("-")`)와 `DAY_MASTER_KEYWORDS` 키를 1:1 미러한 한국어 테이블.

```ts
import { elementOf } from "../../lib/saju-display";
import type { WuXing } from "../../lib/saju-types";

const COMPAT_LABELS: Record<string, string> = {
  "fire-water": "뜨겁고 차가운 케미 🔥💧",
  "fire-wood": "내가 그 사람의 불씨를 키워요 🌳🔥",
  "earth-fire": "따뜻하고 든든한 사이 🔥🏔️",
  "earth-metal": "탄탄한 파워 커플 🏔️⚙️",
  "metal-water": "시원하고 깊고 맑은 사이 ⚙️💧",
  "water-wood": "함께 조용히 자라는 사이 💧🌳",
  "metal-wood": "팽팽한 긴장, 강한 끌림 ⚙️🌳",
  "earth-water": "안정 속에 흐르는 사이 🏔️💧",
  "fire-metal": "강렬하게 다듬어가는 사이 🔥⚙️",
  "earth-wood": "뿌리내리고 솟아오르는 사이 🌳🏔️",
  "fire-fire": "스파크 두 배 🔥🔥",
  "water-water": "깊은 두 영혼 💧💧",
  "wood-wood": "나란히 자라는 사이 🌳🌳",
  "earth-earth": "산처럼 단단한 사이 🏔️🏔️",
  "metal-metal": "매끈하고 거침없는 사이 ⚙️⚙️",
};

export function compatLabelKo(meDayStem: string, idolDayStem: string): string {
  const e1 = elementOf(meDayStem) as WuXing;
  const e2 = elementOf(idolDayStem) as WuXing;
  const key = [e1, e2].sort().join("-");
  return COMPAT_LABELS[key] ?? "세상에 하나뿐인 인연 ✨";
}

const DAY_MASTER_KO: Record<string, string> = {
  甲: "양목(陽木) — 곧게 뻗은 큰 나무, 올곧고 단단한 사람",
  乙: "음목(陰木) — 유연한 덩굴, 부드럽지만 끈질긴 사람",
  丙: "양화(陽火) — 태양처럼 빛나고 외향적인 사람",
  丁: "음화(陰火) — 촛불처럼 따뜻하고 다정한 사람",
  戊: "양토(陽土) — 산처럼 든든하고 흔들림 없는 사람",
  己: "음토(陰土) — 기름진 흙처럼 품어주고 잘 맞춰주는 사람",
  庚: "양금(陽金) — 무쇠처럼 결단력 있고 강인한 사람",
  辛: "음금(陰金) — 세공된 보석처럼 섬세하고 우아한 사람",
  壬: "양수(陽水) — 바다처럼 넓고 자유로운 사람",
  癸: "음수(陰水) — 가랑비처럼 직관적이고 잘 스며드는 사람",
};

export function dayMasterKeywordKo(dayStem: string): string {
  return DAY_MASTER_KO[dayStem] ?? "";
}
```

- [ ] **Step 4: 테스트 통과**

Run: `npm test src/content/ko/labels.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add apps-in-toss/src/content
git commit -m "feat(toss): 한국어 궁합 레이블 + 일간 키워드 콘텐츠"
```

---

## Task 4: 한국어 콘텐츠 — 타로 리딩 (오늘 + 스프레드)

**Files:**
- Create: `apps-in-toss/src/content/ko/tarot.ts`
- Test: `apps-in-toss/src/content/ko/tarot.test.ts`

**Interfaces:**
- Consumes: `TarotCard` (tarot.ts), `WuXing` (saju-types), `elementLabel` (saju-display)
- Produces:
  - `dailyReadingKo(card: TarotCard, element: WuXing): string`
  - `spreadReadingKo(cards: [TarotCard,TarotCard,TarotCard], element: WuXing): { past; present; future; synthesis }`

영어 `card.theme` 를 쓰지 않고, 이미 한국어인 `card.name_kr` + suit별 한국어 뉘앙스 + `elementLabel(el,"ko")` 로 조립한다(완전 한국어).

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { dailyReadingKo, spreadReadingKo } from "./tarot";
import type { TarotCard } from "../../lib/tarot";

const card = (id: number, name_kr: string, suit: TarotCard["suit"]): TarotCard => ({
  id, suit, rank: "0", name_en: "x", name_kr, filename: "x.png",
  element: null, theme: "ENGLISH THEME", keywords: "x",
});

test("오늘의 리딩은 한국어 카드명과 오행을 포함하고 영어 theme를 쓰지 않는다", () => {
  const out = dailyReadingKo(card(1, "광대", "major"), "fire");
  expect(out).toContain("광대");
  expect(out).toContain("화");
  expect(out).not.toContain("ENGLISH THEME");
});

test("스프레드는 과거/현재/미래/합 4문장이 모두 한국어", () => {
  const out = spreadReadingKo(
    [card(1, "광대", "major"), card(2, "마법사", "wands"), card(3, "여사제", "cups")],
    "water",
  );
  expect(out.past).toContain("광대");
  expect(out.present).toContain("마법사");
  expect(out.future).toContain("여사제");
  expect(out.synthesis).toContain("수");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/content/ko/tarot.test.ts`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현**

```ts
import type { TarotCard } from "../../lib/tarot";
import type { WuXing } from "../../lib/saju-types";
import { elementLabel } from "../../lib/saju-display";

const SUIT_NUANCE: Record<TarotCard["suit"], string> = {
  major: "큰 흐름과 운명적인 메시지",
  wands: "열정과 행동",
  cups: "감정과 관계",
  swords: "생각과 결단",
  pentacles: "현실과 결실",
};

export function dailyReadingKo(card: TarotCard, element: WuXing): string {
  const el = elementLabel(element, "ko");
  return `오늘 당신의 카드는 '${card.name_kr}' — ${SUIT_NUANCE[card.suit]}의 카드예요. ${el}의 기운을 믿고 나아가면 좋은 일이 따라올 거예요. ✨`;
}

export function spreadReadingKo(
  cards: [TarotCard, TarotCard, TarotCard],
  element: WuXing,
): { past: string; present: string; future: string; synthesis: string } {
  const [p, c, f] = cards;
  const el = elementLabel(element, "ko");
  return {
    past: `과거의 카드 '${p.name_kr}' — 지나온 길(${SUIT_NUANCE[p.suit]})이 지금의 당신을 만들었어요.`,
    present: `현재의 카드 '${c.name_kr}' — 지금은 ${SUIT_NUANCE[c.suit]}에 집중할 때예요.`,
    future: `미래의 카드 '${f.name_kr}' — 앞으로는 ${SUIT_NUANCE[f.suit]}의 흐름이 당신 편이에요.`,
    synthesis: `${el}의 기운을 믿고 흐름을 따라가면, 과거의 경험이 현재를 지나 좋은 미래로 이어질 거예요. ✨`,
  };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `npm test src/content/ko/tarot.test.ts`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add apps-in-toss/src/content/ko/tarot.ts apps-in-toss/src/content/ko/tarot.test.ts
git commit -m "feat(toss): 한국어 타로 리딩(오늘/스프레드) 콘텐츠"
```

---

## Task 5: App 상태 + 탭 네비 + 생일 입력 + 내 사주 결과

**Files:**
- Create: `apps-in-toss/src/state/user-saju.ts` (localStorage 헬퍼)
- Create: `apps-in-toss/src/components/BirthForm.tsx`
- Create: `apps-in-toss/src/components/PillarsGrid.tsx`
- Create: `apps-in-toss/src/components/WuxingBalance.tsx`
- Create: `apps-in-toss/src/screens/MySajuScreen.tsx`
- Create: `apps-in-toss/src/components/TabNav.tsx`
- Modify: `apps-in-toss/src/App.tsx` (screen state + nav + userSaju 공유)
- Test: `apps-in-toss/src/state/user-saju.test.ts`, `apps-in-toss/src/screens/MySajuScreen.test.tsx`

**Interfaces:**
- Consumes: `birthToSaju`, `dateToLuck`, `wuxingBalance`, `dayMasterInfo`, `pillarKo`, `elementOf`, `ELEMENT_TEXT`, `WUXING_KO`, `birthSchema`, `BirthData`, `UserSaju`; `dayMasterKeywordKo` (Task 3)
- Produces:
  - `loadUserSaju(): UserSaju | null`, `saveUserSaju(s: UserSaju): void`
  - `MySajuScreen({ saju, onCalc }: { saju: UserSaju | null; onCalc: (s: UserSaju) => void })`
  - `App` 가 `userSaju` state 를 보유하고 4개 screen 에 내려줌. `Screen = "saju" | "compat" | "tarot" | "spread"`.

- [ ] **Step 1: localStorage 헬퍼 실패 테스트**

```ts
import { loadUserSaju, saveUserSaju } from "./user-saju";

test("저장 후 로드 라운드트립", () => {
  const s = { pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
    dayMaster: "辛", isTimeCorrected: false } as any;
  saveUserSaju(s);
  expect(loadUserSaju()?.dayMaster).toBe("辛");
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `npm test src/state/user-saju.test.ts` → FAIL.

```ts
import type { UserSaju } from "../lib/saju-types";
const KEY = "ksaju.toss.userSaju.v1";
export function saveUserSaju(s: UserSaju): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function loadUserSaju(): UserSaju | null {
  try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as UserSaju) : null; }
  catch { return null; }
}
```

Run: `npm test src/state/user-saju.test.ts` → PASS.

- [ ] **Step 3: `BirthForm.tsx` 구현**

react-hook-form + zod(`birthSchema`). 한국어 라벨. 출생시간은 선택. submit 시 `BirthData` 를 부모에 전달.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { birthSchema, type BirthData } from "../lib/kst-types";

export function BirthForm({ onSubmit }: { onSubmit: (b: BirthData) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(birthSchema) });
  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v as unknown as BirthData))}
          className="flex flex-col gap-3">
      <label className="text-sm">생년월일</label>
      <div className="flex gap-2">
        <input type="number" placeholder="년" {...register("year", { valueAsNumber: true })}
               className="w-24 rounded-md border px-2 py-2" />
        <input type="number" placeholder="월" {...register("month", { valueAsNumber: true })}
               className="w-16 rounded-md border px-2 py-2" />
        <input type="number" placeholder="일" {...register("day", { valueAsNumber: true })}
               className="w-16 rounded-md border px-2 py-2" />
      </div>
      <label className="text-sm">태어난 시각 (모르면 비워두세요)</label>
      <div className="flex gap-2">
        <input type="number" placeholder="시" {...register("hour", { valueAsNumber: true })}
               className="w-16 rounded-md border px-2 py-2" />
        <input type="number" placeholder="분" {...register("minute", { valueAsNumber: true })}
               className="w-16 rounded-md border px-2 py-2" />
      </div>
      {errors.root && <p className="text-xs text-[var(--color-jindallae)]">입력을 확인해 주세요.</p>}
      <button type="submit" disabled={isSubmitting}
              className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
        내 사주 보기
      </button>
    </form>
  );
}
```

> 참고: `birthSchema` 의 실제 필드(특히 `timezone` 기본값/optional, hour/minute nullable)는 복사한 `kst-types.ts` 를 확인해 입력 매핑을 맞춘다. 미니앱은 한국 사용자 가정이므로 `timezone` 은 폼에서 `"Asia/Seoul"` 고정 hidden 값으로 채운다.

- [ ] **Step 4: `PillarsGrid.tsx` + `WuxingBalance.tsx` 구현**

```tsx
// PillarsGrid.tsx
import { pillarKo, elementOf, ELEMENT_TEXT } from "../lib/saju-display";
import type { UserSaju } from "../lib/saju-types";

const ORDER: [keyof UserSaju["pillars"], string][] = [
  ["year", "년주"], ["month", "월주"], ["day", "일주"], ["hour", "시주"],
];
export function PillarsGrid({ saju }: { saju: UserSaju }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {ORDER.map(([k, label]) => {
        const p = saju.pillars[k];
        return (
          <div key={k} className="rounded-lg bg-white p-2">
            <div className="text-xs text-gray-500">{label}</div>
            {p ? (
              <>
                <div className="text-2xl font-bold tracking-widest">
                  <span className={ELEMENT_TEXT[elementOf(p[0])]}>{p[0]}</span>
                  <span className={ELEMENT_TEXT[elementOf(p[1])]}>{p[1]}</span>
                </div>
                <div className="text-xs text-gray-500">{pillarKo(p)}</div>
              </>
            ) : <div className="text-gray-300 text-2xl">·</div>}
          </div>
        );
      })}
    </div>
  );
}
```

```tsx
// WuxingBalance.tsx
import { wuxingBalance, ELEMENT_TEXT, WUXING_KO } from "../lib/saju-display";
import type { UserSaju, WuXing } from "../lib/saju-types";

const ELS: WuXing[] = ["wood", "fire", "earth", "metal", "water"];
export function WuxingBalance({ saju }: { saju: UserSaju }) {
  const b = wuxingBalance(saju);
  const max = Math.max(1, ...ELS.map((e) => b[e]));
  return (
    <div className="flex items-end justify-around gap-2 h-24">
      {ELS.map((e) => (
        <div key={e} className="flex flex-col items-center gap-1">
          <div className="w-6 rounded-t bg-current" style={{ height: `${(b[e] / max) * 100}%` }} />
          <span className={`text-xs ${ELEMENT_TEXT[e]}`}>{WUXING_KO[e]} {b[e]}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: `MySajuScreen.test.tsx` 실패 테스트**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MySajuScreen } from "./MySajuScreen";

test("생일 입력 후 4기둥과 일간 키워드가 보인다", async () => {
  const onCalc = vi.fn();
  render(<MySajuScreen saju={null} onCalc={onCalc} />);
  await userEvent.type(screen.getByPlaceholderText("년"), "1994");
  await userEvent.type(screen.getByPlaceholderText("월"), "9");
  await userEvent.type(screen.getByPlaceholderText("일"), "12");
  await userEvent.click(screen.getByRole("button", { name: "내 사주 보기" }));
  expect(await screen.findByText("일주")).toBeInTheDocument();
  expect(onCalc).toHaveBeenCalled();
});
```

- [ ] **Step 6: 실패 확인 → `MySajuScreen.tsx` 구현**

Run: `npm test src/screens/MySajuScreen.test.tsx` → FAIL.

```tsx
import { useState } from "react";
import { BirthForm } from "../components/BirthForm";
import { PillarsGrid } from "../components/PillarsGrid";
import { WuxingBalance } from "../components/WuxingBalance";
import { birthToSaju, dateToLuck } from "../lib/saju";
import { dayMasterInfo, elementLabel } from "../lib/saju-display";
import { dayMasterKeywordKo } from "../content/ko/labels";
import { calcFortune } from "../lib/fortune";
import { FortuneCards } from "../components/FortuneCards"; // Task 6
import type { BirthData } from "../lib/kst-types";
import type { UserSaju } from "../lib/saju-types";

export function MySajuScreen({ saju, onCalc }:
  { saju: UserSaju | null; onCalc: (s: UserSaju) => void }) {
  const [local, setLocal] = useState<UserSaju | null>(saju);
  const cur = local ?? saju;

  function handle(b: BirthData) {
    const s = birthToSaju({ ...b, timezone: "Asia/Seoul" } as BirthData);
    setLocal(s); onCalc(s);
  }

  if (!cur) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">내 사주</h2>
        <p className="text-sm text-gray-600">생일을 넣으면 사주 네 기둥과 오늘의 운세를 볼 수 있어요.</p>
        <BirthForm onSubmit={handle} />
      </section>
    );
  }

  const dm = dayMasterInfo(cur.dayMaster);
  const fortune = calcFortune(cur, dateToLuck(new Date()), "ko");
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold">내 사주</h2>
        <p className="text-sm">
          일간 <b className="text-[var(--color-jindallae)]">{cur.dayMaster}</b>
          ({elementLabel(dm.element, "ko")}) — {dayMasterKeywordKo(cur.dayMaster)}
        </p>
      </div>
      <PillarsGrid saju={cur} />
      <WuxingBalance saju={cur} />
      <FortuneCards cards={fortune} />
      <button onClick={() => { setLocal(null); }}
              className="text-sm text-gray-500 underline">생일 다시 입력</button>
      <p className="text-xs text-gray-400 text-center">For entertainment 🌙</p>
    </section>
  );
}
```

> `FortuneCards` 는 Task 6 에서 만든다. Task 5 를 먼저 통과시키려면 일시적으로 `<FortuneCards>` 줄을 주석 처리하고 Task 6 에서 활성화하거나, Task 6 의 빈 컴포넌트 스텁을 먼저 생성한다(권장: 스텁 먼저).

- [ ] **Step 7: `TabNav` + `App.tsx` 통합**

```tsx
// TabNav.tsx
export type Screen = "saju" | "compat" | "tarot" | "spread";
const TABS: [Screen, string][] = [
  ["saju", "내 사주"], ["compat", "궁합"], ["tarot", "오늘의 타로"], ["spread", "타로 스프레드"],
];
export function TabNav({ active, onChange }:
  { active: Screen; onChange: (s: Screen) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 flex border-t bg-white">
      {TABS.map(([s, label]) => (
        <button key={s} onClick={() => onChange(s)}
          className={`flex-1 py-3 text-xs ${active === s
            ? "font-bold text-[var(--color-jindallae)]" : "text-gray-500"}`}>
          {label}
        </button>
      ))}
    </nav>
  );
}
```

`App.tsx`:

```tsx
import { useState } from "react";
import { TabNav, type Screen } from "./components/TabNav";
import { MySajuScreen } from "./screens/MySajuScreen";
import { CompatScreen } from "./screens/CompatScreen";   // Task 7
import { TarotScreen } from "./screens/TarotScreen";     // Task 8
import { SpreadScreen } from "./screens/SpreadScreen";   // Task 9
import { loadUserSaju, saveUserSaju } from "./state/user-saju";
import type { UserSaju } from "./lib/saju-types";

export default function App() {
  const [screen, setScreen] = useState<Screen>("saju");
  const [userSaju, setUserSaju] = useState<UserSaju | null>(loadUserSaju());
  function onCalc(s: UserSaju) { setUserSaju(s); saveUserSaju(s); }
  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 text-lg font-bold text-[var(--color-jindallae)]">K사주</header>
      <main className="px-4 pb-24">
        {screen === "saju" && <MySajuScreen saju={userSaju} onCalc={onCalc} />}
        {screen === "compat" && <CompatScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />}
        {screen === "tarot" && <TarotScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />}
        {screen === "spread" && <SpreadScreen me={userSaju} onNeedSaju={() => setScreen("saju")} />}
      </main>
      <TabNav active={screen} onChange={setScreen} />
    </div>
  );
}
```

> Task 7-9 화면이 아직 없으면 일시적으로 빈 스텁 컴포넌트(`export function CompatScreen() { return null; }` 등)를 먼저 만들어 컴파일을 통과시키고, 각 태스크에서 채운다. Task 1 의 `App.test.tsx` 헤더 단언은 그대로 유효.

- [ ] **Step 8: 테스트 통과 확인**

Run: `npm test` → 전체 PASS (App, saju, labels, tarot, user-saju, MySajuScreen).

- [ ] **Step 9: 커밋**

```bash
git add apps-in-toss/src
git commit -m "feat(toss): App 셸·탭 네비 + 생일 입력 + 내 사주 결과 화면"
```

---

## Task 6: 운세 카드 (FortuneCards)

**Files:**
- Create: `apps-in-toss/src/components/FortuneCards.tsx`
- Test: `apps-in-toss/src/components/FortuneCards.test.tsx`

**Interfaces:**
- Consumes: `FortuneCard` (fortune.ts), `ELEMENT_TEXT` (saju-display)
- Produces: `FortuneCards({ cards }: { cards: FortuneCard[] })` — Money/Love/Career/올해 4카드를 오행색 배지와 함께 렌더.

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import { FortuneCards } from "./FortuneCards";
import type { FortuneCard } from "../lib/fortune";

const cards: FortuneCard[] = [
  { key: "money", emoji: "💰", element: "metal", tierLabel: "돈복 좋음", line: "올해는 돈이 들어와요" },
  { key: "love", emoji: "💘", element: "fire", tierLabel: "열정형", line: "사랑운 상승" },
];
test("운세 카드 라인과 티어 라벨이 보인다", () => {
  render(<FortuneCards cards={cards} />);
  expect(screen.getByText("올해는 돈이 들어와요")).toBeInTheDocument();
  expect(screen.getByText("돈복 좋음")).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test src/components/FortuneCards.test.tsx` → FAIL.

- [ ] **Step 3: 구현**

```tsx
import type { FortuneCard } from "../lib/fortune";
import { ELEMENT_TEXT } from "../lib/saju-display";

const TITLE: Record<FortuneCard["key"], string> = {
  money: "금전운", love: "연애운", career: "직업운", time: "올해 흐름",
};
export function FortuneCards({ cards }: { cards: FortuneCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.key} className="rounded-xl bg-white p-3 flex flex-col gap-1">
          <div className="text-sm font-bold">{c.emoji} {TITLE[c.key]}</div>
          <div className={`text-xs font-bold ${ELEMENT_TEXT[c.element]}`}>{c.tierLabel}</div>
          <p className="text-sm">{c.line}</p>
          {c.subLine && <p className="text-xs text-gray-500">{c.subLine}</p>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 + MySajuScreen 의 FortuneCards 활성화**

Run: `npm test src/components/FortuneCards.test.tsx` → PASS. Task 5 에서 스텁/주석 처리했다면 실제 import 로 교체하고 `npm test` 전체 PASS 확인.

- [ ] **Step 5: 커밋**

```bash
git add apps-in-toss/src/components/FortuneCards.tsx apps-in-toss/src/components/FortuneCards.test.tsx apps-in-toss/src/screens/MySajuScreen.tsx
git commit -m "feat(toss): fun 운세 카드(금전/연애/직업/올해)"
```

---

## Task 7: 궁합 화면 (아이돌 검색·선택 → 결과)

**Files:**
- Create: `apps-in-toss/src/components/IdolPicker.tsx`
- Create: `apps-in-toss/src/components/CompatResult.tsx`
- Create: `apps-in-toss/src/screens/CompatScreen.tsx`
- Test: `apps-in-toss/src/screens/CompatScreen.test.tsx`

**Interfaces:**
- Consumes: `groups`, `getIdolsByGroup`, `searchIdols`, `Idol` (idols); `calcCompatibility`, `normalizeIdolSaju`, `toCompatPillars`; `getReading`; `compatLabelKo` (Task 3); `UserSaju`
- Produces: `CompatScreen({ me, onNeedSaju }: { me: UserSaju | null; onNeedSaju: () => void })`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompatScreen } from "./CompatScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = { pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛", isTimeCorrected: false } as any;

test("사주 없으면 안내, 있으면 아이돌 검색이 보인다", () => {
  const { rerender } = render(<CompatScreen me={null} onNeedSaju={() => {}} />);
  expect(screen.getByText(/먼저 내 사주/)).toBeInTheDocument();
  rerender(<CompatScreen me={me} onNeedSaju={() => {}} />);
  expect(screen.getByPlaceholderText(/아이돌 검색/)).toBeInTheDocument();
});

test("아이돌 검색·선택 시 궁합 점수와 한국어 레이블이 보인다", async () => {
  render(<CompatScreen me={me} onNeedSaju={() => {}} />);
  await userEvent.type(screen.getByPlaceholderText(/아이돌 검색/), "RM");
  await userEvent.click(await screen.findByRole("button", { name: /RM/ }));
  expect(await screen.findByText(/점/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test src/screens/CompatScreen.test.tsx` → FAIL.

- [ ] **Step 3: `IdolPicker.tsx` 구현**

검색어가 있으면 `searchIdols`, 없으면 그룹 목록(`groups` + `getIdolsByGroup`). `onSelect(idol)` 콜백.

```tsx
import { useState } from "react";
import { groups, getIdolsByGroup, searchIdols, type Idol } from "../lib/idols";

export function IdolPicker({ onSelect }: { onSelect: (i: Idol) => void }) {
  const [q, setQ] = useState("");
  const results = q.trim() ? searchIdols(q) : [];
  return (
    <div className="flex flex-col gap-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
        placeholder="아이돌 검색 (이름)"
        className="rounded-md border px-3 py-2" />
      {q.trim() ? (
        <div className="flex flex-col gap-1">
          {results.map((i) => (
            <button key={i.id} onClick={() => onSelect(i)}
              className="text-left rounded-md px-3 py-2 hover:bg-gray-50">
              {i.name} <span className="text-xs text-gray-500">{i.group}</span>
            </button>
          ))}
          {results.length === 0 && <p className="text-sm text-gray-400">검색 결과가 없어요.</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <details key={g}>
              <summary className="cursor-pointer py-1 font-medium">{g}</summary>
              <div className="flex flex-wrap gap-1 pl-2">
                {getIdolsByGroup(g).map((i) => (
                  <button key={i.id} onClick={() => onSelect(i)}
                    className="rounded-full border px-3 py-1 text-sm">{i.name}</button>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `CompatResult.tsx` 구현**

```tsx
import type { Idol } from "../lib/idols";
import type { UserSaju } from "../lib/saju-types";
import { calcCompatibility, normalizeIdolSaju } from "../lib/compatibility";
import { toCompatPillars } from "../lib/saju";
import { getReading } from "../lib/reading";
import { compatLabelKo } from "../content/ko/labels";

export function CompatResult({ me, idol }: { me: UserSaju; idol: Idol }) {
  const mePillars = toCompatPillars(me);
  const idolPillars = normalizeIdolSaju(idol.saju);
  const r = calcCompatibility(mePillars, idolPillars);
  const label = compatLabelKo(mePillars.day[0], idolPillars.day[0]);
  const reading = getReading(mePillars, idolPillars, r.score, "ko");
  return (
    <div className="rounded-xl bg-white p-4 flex flex-col gap-2 text-center">
      <div className="text-sm text-gray-500">나 ✕ {idol.name}</div>
      <div className="text-4xl font-bold text-[var(--color-jindallae)]">{r.score}점</div>
      <div className="font-bold">{label}</div>
      <p className="text-sm">{reading}</p>
      <p className="text-xs text-gray-400">For entertainment 🌙</p>
    </div>
  );
}
```

- [ ] **Step 5: `CompatScreen.tsx` 구현**

```tsx
import { useState } from "react";
import { IdolPicker } from "../components/IdolPicker";
import { CompatResult } from "../components/CompatResult";
import type { Idol } from "../lib/idols";
import type { UserSaju } from "../lib/saju-types";

export function CompatScreen({ me, onNeedSaju }:
  { me: UserSaju | null; onNeedSaju: () => void }) {
  const [idol, setIdol] = useState<Idol | null>(null);
  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">궁합</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button onClick={onNeedSaju}
          className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
          내 사주 입력하러 가기
        </button>
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">최애와 궁합</h2>
      {idol && <CompatResult me={me} idol={idol} />}
      {idol && <button onClick={() => setIdol(null)} className="text-sm underline text-gray-500">
        다른 아이돌 보기</button>}
      {!idol && <IdolPicker onSelect={setIdol} />}
    </section>
  );
}
```

- [ ] **Step 6: 테스트 통과**

Run: `npm test src/screens/CompatScreen.test.tsx` → PASS. (검색어 "RM" 이 DB에 존재함을 전제 — 없으면 DB에 있는 실제 이름으로 테스트 수정.)

- [ ] **Step 7: 커밋**

```bash
git add apps-in-toss/src/components/IdolPicker.tsx apps-in-toss/src/components/CompatResult.tsx apps-in-toss/src/screens/CompatScreen.tsx apps-in-toss/src/screens/CompatScreen.test.tsx
git commit -m "feat(toss): 아이돌 궁합 화면(검색·선택·점수·한국어 레이블·리딩)"
```

---

## Task 8: 오늘의 타로 화면

**Files:**
- Create: `apps-in-toss/src/components/TarotCardView.tsx`
- Create: `apps-in-toss/src/screens/TarotScreen.tsx`
- Test: `apps-in-toss/src/screens/TarotScreen.test.tsx`

**Interfaces:**
- Consumes: `drawDailyCard`, `kstDateString`, `TarotCard` (tarot); `dailyReadingKo` (Task 4); `elementOf` (saju-display); `UserSaju`
- Produces: `TarotScreen({ me, onNeedSaju })`

타로 색 액센트 = 읽는 사람(나) 일간 오행. 카드 element 가 null(major)일 수 있으므로 **리딩 오행은 사용자 일간 오행**을 쓴다.

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import { TarotScreen } from "./TarotScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = { pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛", isTimeCorrected: false } as any;

test("오늘의 카드 이름과 한국어 리딩이 결정적으로 보인다", () => {
  render(<TarotScreen me={me} onNeedSaju={() => {}} />);
  // 같은 사주+오늘 날짜 → 항상 같은 카드. 리딩 문구의 고정 접두어로 확인.
  expect(screen.getByText(/오늘 당신의 카드는/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `npm test src/screens/TarotScreen.test.tsx` → FAIL.

```tsx
// TarotCardView.tsx
import type { TarotCard } from "../lib/tarot";
export function TarotCardView({ card }: { card: TarotCard }) {
  return (
    <div className="mx-auto w-40 rounded-xl bg-white p-3 text-center shadow">
      <div className="text-5xl py-6">🃏</div>
      <div className="font-bold">{card.name_kr}</div>
      <div className="text-xs text-gray-500">{card.name_en}</div>
    </div>
  );
}
```

```tsx
// TarotScreen.tsx
import { drawDailyCard, kstDateString } from "../lib/tarot";
import { dailyReadingKo } from "../content/ko/tarot";
import { elementOf } from "../lib/saju-display";
import { TarotCardView } from "../components/TarotCardView";
import type { UserSaju } from "../lib/saju-types";

export function TarotScreen({ me, onNeedSaju }:
  { me: UserSaju | null; onNeedSaju: () => void }) {
  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">오늘의 타로</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button onClick={onNeedSaju}
          className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
          내 사주 입력하러 가기</button>
      </section>
    );
  }
  const card = drawDailyCard(me, kstDateString());
  const el = elementOf(me.dayMaster);
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">오늘의 타로</h2>
      <TarotCardView card={card} />
      <p className="text-sm text-center">{dailyReadingKo(card, el)}</p>
      <p className="text-xs text-gray-400 text-center">For entertainment 🌙</p>
    </section>
  );
}
```

- [ ] **Step 3: 테스트 통과**

Run: `npm test src/screens/TarotScreen.test.tsx` → PASS.

- [ ] **Step 4: 커밋**

```bash
git add apps-in-toss/src/components/TarotCardView.tsx apps-in-toss/src/screens/TarotScreen.tsx apps-in-toss/src/screens/TarotScreen.test.tsx
git commit -m "feat(toss): 오늘의 타로 카드 화면(결정적 드로우 + 한국어 리딩)"
```

---

## Task 9: 타로 스프레드 화면 (과거-현재-미래)

**Files:**
- Create: `apps-in-toss/src/screens/SpreadScreen.tsx`
- Test: `apps-in-toss/src/screens/SpreadScreen.test.tsx`

**Interfaces:**
- Consumes: `drawSpread`, `TarotCard` (tarot); `spreadReadingKo` (Task 4); `TarotCardView` (Task 8); `elementOf`; `UserSaju`
- Produces: `SpreadScreen({ me, onNeedSaju })`

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpreadScreen } from "./SpreadScreen";
import type { UserSaju } from "../lib/saju-types";

const me: UserSaju = { pillars: { year: "甲戌", month: "癸酉", day: "辛卯", hour: null },
  dayMaster: "辛", isTimeCorrected: false } as any;

test("뽑기 버튼을 누르면 과거/현재/미래 3장과 합 문장이 보인다", async () => {
  render(<SpreadScreen me={me} onNeedSaju={() => {}} />);
  await userEvent.click(screen.getByRole("button", { name: /카드 뽑기/ }));
  expect(await screen.findByText(/과거의 카드/)).toBeInTheDocument();
  expect(screen.getByText(/현재의 카드/)).toBeInTheDocument();
  expect(screen.getByText(/미래의 카드/)).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인 → 구현**

Run: `npm test src/screens/SpreadScreen.test.tsx` → FAIL.

```tsx
import { useState } from "react";
import { drawSpread, type TarotCard } from "../lib/tarot";
import { spreadReadingKo } from "../content/ko/tarot";
import { elementOf } from "../lib/saju-display";
import { TarotCardView } from "../components/TarotCardView";
import type { UserSaju } from "../lib/saju-types";

export function SpreadScreen({ me, onNeedSaju }:
  { me: UserSaju | null; onNeedSaju: () => void }) {
  const [cards, setCards] = useState<[TarotCard, TarotCard, TarotCard] | null>(null);
  if (!me) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">타로 스프레드</h2>
        <p className="text-sm">먼저 내 사주를 입력해 주세요.</p>
        <button onClick={onNeedSaju}
          className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
          내 사주 입력하러 가기</button>
      </section>
    );
  }
  const el = elementOf(me.dayMaster);
  const reading = cards ? spreadReadingKo(cards, el) : null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">과거 · 현재 · 미래</h2>
      <button onClick={() => setCards(drawSpread())}
        className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
        카드 뽑기</button>
      {cards && reading && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((c, i) => <TarotCardView key={i} card={c} />)}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>{reading.past}</p><p>{reading.present}</p><p>{reading.future}</p>
            <p className="font-bold">{reading.synthesis}</p>
          </div>
          <p className="text-xs text-gray-400 text-center">For entertainment 🌙</p>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: 테스트 통과**

Run: `npm test src/screens/SpreadScreen.test.tsx` → PASS.

- [ ] **Step 4: 커밋**

```bash
git add apps-in-toss/src/screens/SpreadScreen.tsx apps-in-toss/src/screens/SpreadScreen.test.tsx
git commit -m "feat(toss): 타로 과거-현재-미래 스프레드 화면"
```

---

## Task 10: 공유 카드 (9:16 PNG) + 외부링크 없는 푸터

**Files:**
- Create: `apps-in-toss/src/components/ShareFooter.tsx`
- Create: `apps-in-toss/src/components/ShareCard.tsx`
- Create: `apps-in-toss/src/lib/share.ts`
- Modify: `apps-in-toss/src/screens/CompatScreen.tsx` (Share 버튼 + 카드)
- Test: `apps-in-toss/src/components/ShareFooter.test.tsx`, `apps-in-toss/src/lib/share.test.ts`

**Interfaces:**
- Consumes: `html-to-image` (`toPng`)
- Produces:
  - `ShareFooter()` — QR·URL 없이 앱명 + "For entertainment 🌙" 만.
  - `ShareCard({ children })` — 360×640(9:16) 한지 카드 래퍼.
  - `shareOrDownloadPng(node: HTMLElement, filename: string): Promise<void>`

**중요(Global Constraint):** 공유 카드/푸터에 QR·ksaju.me·ko-fi·외부 URL **금지**.

- [ ] **Step 1: ShareFooter 실패 테스트 (외부링크 부재 단언)**

```tsx
import { render } from "@testing-library/react";
import { ShareFooter } from "./ShareFooter";

test("푸터에 외부 링크/URL/QR이 없다", () => {
  const { container } = render(<ShareFooter />);
  expect(container.querySelectorAll("a").length).toBe(0);
  expect(container.querySelector("img")).toBeNull();
  expect(container.textContent).not.toMatch(/ksaju\.me|ko-fi|http/i);
  expect(container.textContent).toContain("K사주");
});
```

- [ ] **Step 2: 실패 확인 → ShareFooter 구현**

Run: `npm test src/components/ShareFooter.test.tsx` → FAIL.

```tsx
export function ShareFooter() {
  return (
    <div className="mt-3 text-center">
      <div className="font-bold text-[var(--color-jindallae)]">K사주</div>
      <div className="text-xs text-gray-400">For entertainment 🌙</div>
    </div>
  );
}
```

- [ ] **Step 3: ShareCard 래퍼 구현**

```tsx
export function ShareCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 360, height: 640 }}
      className="bg-[var(--color-hanji)] p-5 flex flex-col justify-between">
      {children}
    </div>
  );
}
```

- [ ] **Step 4: `share.ts` 구현 + 테스트**

토스 web-framework 가 네이티브 공유 API 를 제공하면 우선 사용하고, 없으면 다운로드 폴백. (프레임워크 공유 API 의 정확한 시그니처는 `node_modules/@apps-in-toss/web-framework` 의 타입에서 확인 후 연결. 미확인 시 다운로드 폴백만으로도 출시 가능.)

```ts
import { toPng } from "html-to-image";

export async function shareOrDownloadPng(node: HTMLElement, filename: string): Promise<void> {
  await (document as any).fonts?.ready;
  const dataUrl = await toPng(node, { pixelRatio: 3, cacheBust: true });
  // 폴백: 다운로드 (외부 통신 없음)
  const a = document.createElement("a");
  a.href = dataUrl; a.download = filename;
  a.click();
}
```

테스트(`share.test.ts`)는 `html-to-image` 를 mock 해 `toPng` 호출과 download 트리거를 검증:

```ts
import { vi } from "vitest";
vi.mock("html-to-image", () => ({ toPng: vi.fn(async () => "data:image/png;base64,xx") }));
import { shareOrDownloadPng } from "./share";

test("toPng 결과로 다운로드를 트리거한다", async () => {
  const node = document.createElement("div");
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await shareOrDownloadPng(node, "ksaju.png");
  expect(click).toHaveBeenCalled();
});
```

- [ ] **Step 5: 실패→통과 확인**

Run: `npm test src/lib/share.test.ts src/components/ShareFooter.test.tsx` → PASS.

- [ ] **Step 6: CompatScreen 에 공유 연결**

`CompatResult` 를 `ShareCard` 로 감싼 숨김 노드(`ref`)를 두고, "공유하기 ✨" 버튼이 `shareOrDownloadPng(ref.current, '내사주-궁합.png')` 호출. 미리보기=export 동일 노드. ShareFooter 포함.

```tsx
// CompatScreen.tsx 내 idol 결과부 발췌
import { useRef } from "react";
import { ShareCard } from "../components/ShareCard";
import { ShareFooter } from "../components/ShareFooter";
import { shareOrDownloadPng } from "../lib/share";
// ...
const shareRef = useRef<HTMLDivElement>(null);
// 결과 렌더 부분:
<div ref={shareRef}>
  <ShareCard>
    <CompatResult me={me} idol={idol!} />
    <ShareFooter />
  </ShareCard>
</div>
<button onClick={() => shareRef.current && shareOrDownloadPng(shareRef.current, "ksaju-compat.png")}
  className="rounded-md bg-[var(--color-jindallae)] px-4 py-3 font-bold text-white">
  공유하기 ✨</button>
```

- [ ] **Step 7: 전체 테스트 + 빌드**

Run: `npm test` → 전체 PASS. 그리고 `npm run build` → `tsc -b && vite build` 성공, `dist/` 생성.

- [ ] **Step 8: 커밋**

```bash
git add apps-in-toss/src
git commit -m "feat(toss): 9:16 공유 카드 + 외부링크 없는 푸터 + 다운로드 폴백"
```

---

## Task 11: 토스 샌드박스 빌드 확인 + 마무리

**Files:**
- Modify: `apps-in-toss/README.md` (실행/배포 메모)

- [ ] **Step 1: 프로덕션 빌드 + 산출물 점검**

Run: `cd apps-in-toss && npm run build`
Expected: `dist/` 에 정적 번들. 외부 도메인 fetch 없음(코드 grep 으로 `supabase|posthog|openrouter|ko-fi|ksaju.me|qr` 0건 확인).

```bash
cd apps-in-toss && grep -rIE "supabase|posthog|openrouter|ko-fi|ksaju\.me|gen-qr|ksaju-qr" src || echo "OK: 외부참조 없음"
```

- [ ] **Step 2: 로컬 샌드박스 구동(문서 절차)**

`granite.config.ts` 의 `web.commands.dev` 로 dev 서버 기동 후, 앱인토스 개발자센터 절차(로컬 샌드박스 → 실기기 `intoss://ksaju` 딥링크)로 4화면(내 사주/궁합/오늘 타로/스프레드) 동작과 공유 다운로드를 확인한다. (실기기·콘솔 등록·배포는 사용자 실행.)

- [ ] **Step 3: README + 커밋**

`apps-in-toss/README.md` 에 설치/실행/빌드/배포 메모(외부통신 0, 한국어 전용, 콘솔 등록값 TODO) 기록.

```bash
git add apps-in-toss/README.md
git commit -m "docs(toss): 미니앱 실행/배포 메모"
```

---

## Self-Review

**1. Spec coverage:**
- 구조(독립 Vite, libs 복사) → Task 1-2 ✓
- 엔진 재사용(manseryeok/compat/idol-db/tarot) → Task 2 ✓
- 룰베이스/정적 큐레이션(LLM 제거) → Task 3-4 + 엔진 `locale="ko"` ✓
- 한국어 전용 → Global Constraint + Task 3-4 콘텐츠, 모든 UI 한국어 ✓
- 4화면(내 사주+운세/아이돌 궁합/오늘 타로/스프레드) → Task 5-9 ✓
- granite.config(appName/displayName/primaryColor #C8385A) → Task 1 ✓
- 외부링크 배제(QR/ko-fi/ksaju.me) → Global Constraint + Task 10 ShareFooter 단언 + Task 11 grep ✓
- 간단한 토스 랜딩 → Task 1 셸 + Task 5 내 사주 진입 ✓
- 공유 카드 유지(외부링크 제거) → Task 10 ✓

**2. Placeholder scan:** 콘텐츠는 모두 실제 한국어로 인라인. 미확정 항목은 명시적 TODO(콘솔 appName/icon, 토스 네이티브 공유 API 시그니처, RM known-answer 한자는 레포 테스트에서 복사)로 표기 — 구현 차단 없음.

**3. Type consistency:** `UserSaju`/`SajuPillars`/`FortuneCard`/`TarotCard`/`Idol`/`BirthData` 는 복사된 엔진의 export 사용. `compatLabelKo(meStem, idolStem)`·`dayMasterKeywordKo(stem)`·`dailyReadingKo(card, el)`·`spreadReadingKo(cards, el)`·`shareOrDownloadPng(node, name)`·`Screen` 유니온은 정의/소비처가 일치.

**미해결(구현 중 확정):**
- 토스 web-framework 네이티브 공유 API 존재 여부 → Task 10 에서 타입 확인, 없으면 다운로드 폴백.
- React 18 vs 19 → Vite 기본(19). web-framework 가 18 핀이면 18로 다운(영향 적음).
- `birthSchema` 실제 필드/`timezone` 처리 → Task 5 에서 복사본 확인 후 폼 매핑.
