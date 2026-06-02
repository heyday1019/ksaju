# Fun 운세 리딩 (사이클 9) — 설계 문서

> 작성일: 2026-06-02 · 상태: 승인됨 (브레인스토밍 통과)
> 로드맵: CLAUDE.md step 10 / task-log 2026-05-27 "사이클 9"

## 한 줄 요약

'내 사주' 결과 뷰에 **규칙기반·짧고 fun한 영문 운세 카드 4종**(Money / Love / Career / Time)을 추가한다. 명리학 십신(十神) lite 규칙으로 일간·오행밸런스·현재 세운(연주)/월운(월주)에서 결정적으로 산출. **LLM 미사용.** 공유는 비활성 티저 버튼만(실제 이미지 export는 후속 공통기반).

## 원칙 / 비경쟁

- "깊은 상담/리딩 금지(depth 비경쟁)" 유지 — 운세는 테이블 매핑된 짧고 fun한 카드.
- 톤: 밝고 건전, **부정 표현 금지**(10대 타깃). 원소/십신이 0개여도 긍정 프레이밍("freelance soul 🎈").
- `compatibility.ts`의 `funLabel` 테이블 + 관계 판정(합/충/생/극) 패턴을 그대로 차용.

## 범위

### 포함
1. `src/lib/fortune.ts` — 클라이언트 안전 순수 규칙 엔진. `calcFortune(userSaju, currentLuck)` → 4개 `FortuneCard`.
2. `src/app/actions/saju.ts`에 `calcCurrentLuck()` 서버액션 추가 — 오늘(KST) 세운/월운을 manseryeok 재사용으로 계산.
3. `src/components/fortune/` — `fortune-section.tsx`(컨테이너) + `fortune-card.tsx`(프레젠테이션).
4. `SajuResult` 뷰: 오행 섹션과 궁합 섹션 **사이**에 `<FortuneSection>` 삽입.
5. `page.tsx`: 제출 시 `calcCurrentLuck` 호출, `currentLuck`를 SajuResult→FortuneSection으로 전달.
6. 비활성 "Share ☮ (soon)" 티저 버튼.
7. 테스트: `fortune.test.ts`(node), `fortune-section.test.tsx`(RTL/happy-dom).

### 비포함 (이번 사이클 제외)
- 실제 이미지 export/공유 (후속 공통기반, task-log step 13)
- 멀티페이지 골격 / 인연 페이지 (사이클 10-11)
- LLM 생성 텍스트
- Love 카드 지지 합/충 기반(이번엔 일간 아키타입), 지지 충/삼재 (향후 고려)

## 데이터 흐름

```
제출 시 (page.tsx handleSubmit):
  kstResult   = convertToKST(birth)        (기존)
  userSaju    = await calcUserSaju(birth)  (기존)
  currentLuck = await calcCurrentLuck()    (신규)
       ↓ props
  SajuResult(userSaju, kst, currentLuck, onEdit)
       ↓ props
  FortuneSection(userSaju, currentLuck)
       ↓
  fortune.ts: calcFortune(userSaju, currentLuck) → FortuneCard[4]
       ↓
  FortuneCard ×4 (그리드) + Share 티저(비활성)
```

## 모듈 설계

### `src/lib/fortune.ts` (client-safe — `saju-data` / `saju-types` / `saju-display`만 import, manseryeok 미포함)

타입:
```ts
export type FortuneKey = "money" | "love" | "career" | "time";
export interface FortuneCard {
  key: FortuneKey;
  title: string;        // "Money", "Love", "Career", "This Year"
  emoji: string;
  element: WuXing;      // 액센트색 토큰용 (WUXING_META)
  tierLabel: string;    // 짧은 등급/무드 워드 (예 "Magnet", "Steady", "Slow-burn")
  line: string;         // fun 한 줄(2-3줄 분량 가능)
  subLine?: string;     // Time 카드의 이번 달 월운 라인 등 옵션
}
export interface CurrentLuck {
  yearPillar: string;   // "丙午"
  monthPillar: string;  // "甲午" 등
}
export function calcFortune(userSaju: UserSaju, luck: CurrentLuck): FortuneCard[];
```

규칙(십신 lite, 일간 오행 = `dm`):

> **원소 개수 출처:** Money/Career의 "개수"는 `wuxingBalance(userSaju)`(saju-display, 가용 기둥의 천간+지지 오행 카운트, hour 없으면 6자/있으면 8자)의 해당 오행 값을 그대로 사용. 단일 출처 유지.

- **Money 💰** — 재성 = `WUXING_CONTROL[dm]`(일간이 극하는 오행). `wuxingBalance`의 해당 오행 카운트 → tier:
  - 0 → "Wealth's playing hard to get — adventure-budget era 🪙" / tierLabel "Free Spirit"
  - 1-2 → "Steady coins, smart little moves 💰" / "Steady"
  - 3+ → "Money-magnet energy this life 🧲" / "Magnet"
- **Career 👑** — 관성 = 일간을 극하는 오행(`X` where `WUXING_CONTROL[X] === dm`). `wuxingBalance`의 해당 오행 카운트 → tier:
  - 0 → "No boss energy boxing you in — born freelancer 🎈" / "Free Agent"
  - 1-2 → "Climbing steady, one solid step at a time 📈" / "Climber"
  - 3+ → "Natural-leader signal — people follow you 👑" / "Leader"
- **Love 💘** — 일간 천간(10종) → 로맨스 아키타입 테이블(성별 가정 없음). 예:
  - 甲 "Loyal — you lead with steady devotion 🌳" / 丙 "Radiant — you fall fast and bright ☀️" / 辛 "Refined — picky in the best possible way 💎" / 癸 "Intuitive — you read hearts like rain 🌧️" … (10종 전부 정의)
  - tierLabel = 음양/오행 무드 워드(예 "Slow-burn", "All-or-nothing").
- **Time ✨ (This Year)** — 일간 오행 vs **올해 연간** 오행(`luck.yearPillar[0]`)의 관계:
  - 천간합(STEM_COMBO) → "A magnetic year — say yes to the spark ✨" / "Magnetic"
  - 같은 오행 → "Your element's year — you feel right at home 🏠" / "At Home"
  - 연→일간 생(상생) → "Carried & supported all year 🍀" / "Lucky"
  - 일간→연 생 → "You give a lot — remember to refill 🫖" / "Giving"
  - 극(어느 방향이든) → "A spicy year — growth through friction 🌶️" / "Spicy"
  - 그 외 → "An easygoing, do-your-thing year 🌤️" / "Easy"
  - `subLine` = 이번 달 월간(`luck.monthPillar[0]`) 동일 로직의 짧은 한 줄("This month: …").

관계 판정은 `compatibility.ts`의 `STEM_COMBO` / `WUXING_PRODUCE` / `WUXING_CONTROL`와 동일 규칙. 중복 정의 회피 위해 공유 상수는 `saju-data.ts`에서 import(필요 시 `STEM_COMBO`를 `saju-data.ts`로 승격 후 compatibility/fortune 양쪽이 재사용 — 구현 시 결정, 단 단일 출처 유지).

### `src/app/actions/saju.ts` — `calcCurrentLuck()`

```ts
export async function calcCurrentLuck(): Promise<CurrentLuck> {
  // 오늘 KST 정오로 합성 BirthData → birthToSaju → 연주/월주 추출
  // 연·월 기둥은 시각 무관(절기/입춘은 날짜 기준)이라 정오 고정 안전
}
```
- 기존 `birthToSaju`(server-only) 재사용. `new Date()`로 오늘 날짜(서버=Node, 허용). timezone="Asia/Seoul".
- 반환은 `{ yearPillar, monthPillar }` 한자 문자열만(클라가 saju-display로 오행 derive).

### `src/components/fortune/`
- `fortune-card.tsx` (presentational): props `card: FortuneCard`. 제목·이모지·tierLabel 배지·line·subLine. 오행 액센트색 `WUXING_META[card.element].token`(`--color-wuxing-*`). 한지 디자인 토큰.
- `fortune-section.tsx` (`"use client"`): props `userSaju`, `luck`. `calcFortune` 호출 → 카드 4개 그리드(모바일 2열/데스크탑 4열 or 2×2). 헤더 "Your Fortune · 운세". 하단 **비활성** `<Button disabled>` "Share ☮ (soon)" + "For entertainment 🌙" 디스클레이머.

### `SajuResult` 통합
- props에 `currentLuck: CurrentLuck` 추가.
- 오행 섹션 다음, `<CompatibilitySection>` 앞에 `<FortuneSection userSaju={userSaju} luck={currentLuck} />`.

### `page.tsx` 통합
- `handleSubmit`에서 `calcUserSaju`와 함께 `calcCurrentLuck()` 호출(병렬 `Promise.all` 가능). `currentLuck` state 추가 → SajuResult에 전달.

## 테스트

`src/lib/fortune.test.ts` (node env, TDD):
- 재성/관성 오행 derive 정확(알려진 일간, 예: dm=wood → 재성=earth, 관성=metal).
- tier 임계값(0 / 1-2 / 3+) 경계.
- Love 10 stem 전부 라인 존재.
- Time 관계 타입(합/같음/생/극/그외) 각각 올바른 tierLabel.
- 결정적: 동일 입력 → 동일 출력.

`src/components/fortune/fortune-section.test.tsx` (RTL/happy-dom):
- 4개 카드 제목 렌더.
- Share 티저 버튼 `disabled`.

## 검증

- `npm test`(전체 통과, 신규 포함), `tsc`/`eslint` clean, `next build` clean(가능하면 페이지 static 유지 — calcCurrentLuck은 서버액션이라 클라 번들 영향 없음).
- 수동 시각 검증: 제출 → 결과 뷰에 운세 4카드 노출, 다크/모바일.

## 재사용 자산 메모

- `dayMasterInfo`/`elementOf`/`WUXING_META`(saju-display) — 카드 오행·색.
- `WUXING_PRODUCE`/`WUXING_CONTROL`/`STEM_COMBO`(saju-data, STEM_COMBO는 승격 필요 시) — 관계 규칙 단일 출처.
- `birthToSaju`(server-only) — calcCurrentLuck 재사용.
- 그리드/배지/디스클레이머 패턴 — 기존 `compat`/`saju` 컴포넌트 차용.
