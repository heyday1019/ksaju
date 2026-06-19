# Tarot Spread — Past / Present / Future (인터랙티브 3카드)

**Date:** 2026-06-19
**Status:** Design approved, pending spec review
**Cycle:** 27 (candidate)

## 한 줄 정의

사주 기반 게이트를 통과한 사용자가 **과거·현재·미래 3카드 스프레드**를 뽑는 인터랙티브 타로 경험. 뒷면 덱이 부채꼴로 펼쳐지고, 과거/현재/미래 버튼을 차례로 눌러 카드를 무작위로 뽑으며(줌인·플립 연출), 3장만 남고 나머지 덱은 사라진다. 카드별 짧은 해석 + 종합 내러티브 + 9:16 공유 카드.

## 배경 / 결정 사항

기존 `/tarot`는 사주 기반 **결정적 "오늘의 카드" 1장**(`drawDailyCard`, FNV 해시)이고 리딩은 `(date, card_id, day_master, locale)`로 Supabase 캐시된다. 이번 기능은 그 위에 얹는 별도 경험이다.

브레인스토밍에서 확정된 결정:

| # | 결정 | 선택 |
|---|---|---|
| 1 | 배치 | **별도 라우트** `/tarot/spread`. 향후 크레딧 유료화를 이 경계에 얹음 |
| 2 | 카드 선택 | **진짜 랜덤** — 뽑을 때마다 다름. 크레딧 게이트는 다음 사이클 |
| 3 | 리딩 구성 | **카드별 짧은 해석 + 종합 내러티브** — LLM 1회 호출 JSON |
| 4 | 애니메이션 | **`motion`(framer-motion) 도입** — 유료 기능 완성도/화려함 위해 무패키지 원칙 한정 해제(사용자 승인) |
| 5 | 카드 뒷면 | **C안**: 다크 한지 텍스처 + 골드 모서리 창살 + 빨강 낙관(ㅎ), 인라인 SVG |
| 6 | 펼침/레이아웃 | **부채꼴 아치** 펼침 + **가로 3열**(현재 강조) 최종 정렬 |
| 7 | 공유 | **9:16 PNG 포함** — 3장 앞면 + 종합 내러티브, 기존 export 인프라 재사용 |

## 아키텍처

### 라우팅
- `src/app/[locale]/tarot/spread/page.tsx` — server 컴포넌트 wrapper, `metadata` export(privacy/tarot 패턴 미러) → 클라이언트 `SpreadView` 렌더
- `/tarot`(오늘의 카드)에 `/tarot/spread`로 가는 CTA 링크 추가
- 사주 게이트: 기존 `TarotView` 패턴 그대로 — `loadUserSaju`/`saveUserSaju` + `BirthForm` + `calcUserSaju` Server Action 재사용. 사주 없으면 생일 입력 폼, 있으면 스프레드 시작

### 데이터 (`src/lib/tarot.ts` 확장)
```ts
/** 중복 없는 3장 무작위. 업라이트 전용. 결정적 아님(매 호출 다름). rng 주입으로 테스트 가능. */
export function drawSpread(rng: () => number = Math.random): [TarotCard, TarotCard, TarotCard]
```
- `TAROT_CARDS`(78장) 재사용. Fisher–Yates 부분 셔플로 3장 distinct 추출
- 결정성 없음 → `drawDailyCard`와 별개 함수. `rng` 파라미터로 테스트에서 결정적 검증

### API — `src/app/api/tarot-spread-reading/route.ts`
- GET `?cardIds=12,3,45&dayMaster=辛&locale=ko`
- cardIds 3개 파싱 → 각 카드 `theme`/`keywords` + 위치 의미(past/present/future) + 일간 오행(`elementOf`)로 프롬프트 그라운딩
- OpenRouter `anthropic/claude-haiku-4-5-20251001` **1회 호출** → JSON `{ past: string, present: string, future: string, synthesis: string }`
- 응답 파싱(JSON 추출 + 검증). 실패/키 없음 시 **로케일별 정적 fallback**(4필드, 4로케일) 반환
- **Supabase 캐시 없음** — 랜덤이라 캐시 무의미(매 draw = 1회 호출, 향후 크레딧과 직결)
- `OPENROUTER_API_KEY` 재사용(신규 env 없음)

### 컴포넌트 (`src/components/tarot/spread/`)
| 파일 | 책임 |
|---|---|
| `spread-view.tsx` | 사주 게이트 + 제목. `TarotView` 미러. 사주 있으면 `SpreadDraw` |
| `spread-draw.tsx` | 인터랙션 오케스트레이션(motion): 부채 펼침 → 버튼 시퀀스 → 줌인/플립 → 덱 페이드아웃 → `SpreadResult` |
| `spread-card-back.tsx` | 카드 뒷면 SVG (다크 한지 + 골드 창살 + 낙관). propless, 재사용 |
| `spread-result.tsx` | 가로 3열(현재 강조) + 카드별 해석 + 종합 내러티브 + Share/다시보기 |
| `spread-share-card.tsx` | 9:16 360×640(@3x→1080×1920): 3장 앞면 미니 + 종합 + 일간 히어로 + `ShareCardFooter` |
| `spread-share-modal.tsx` | 본문=카드(미리보기=export) + `useShareImage`(사이클 13 엔진 재사용) |

## 인터랙션 흐름 (`SpreadDraw`)

1. 진입 → 뒷면 덱(11장 내외)이 **부채꼴 아치**로 펼쳐짐 (motion stagger 등장)
2. 하단 `과거` `현재` `미래` 버튼 — 순서대로 활성화(과거 → 현재 → 미래 게이팅)
3. 버튼 탭 → `drawSpread` 결과의 해당 카드가 덱에서 **뽑혀 중앙으로 줌인 + 앞면 플립** → 잠깐 노출 후 위치(좌=과거/중=현재/우=미래)로 안착. 카드별 짧은 해석 표시
4. 3장 완료 → **나머지 덱 페이드아웃**(`AnimatePresence`) → 가로 3열(가운데 현재 살짝 큼)로 정렬
5. 종합 내러티브 API 로딩 → 표시. `Share ✨` / `다시 보기`(재셔플=새 draw)

> 카드 무작위 결과는 진입 시 `drawSpread()` 1회로 고정하고, 버튼은 그 3장을 순서대로 공개하는 연출. (셔플 자체는 1회, UX는 한 장씩 뽑는 느낌)

## 비주얼

- **뒷면**: 다크 한지(SVG 노이즈/그라데이션 텍스처) + 골드(`#C49A3F`/`#F4C95D`) 모서리 창살 + 중앙 빨강(`#B5304A`) 낙관 ㅎ. 비율 2:3, 라운드, 인라인 SVG(에셋 0)
- **앞면**: 기존 `public/tarot/*` PNG 재사용
- **액센트색**: 읽는 사람 일간 오행 — `ELEMENT_TEXT[elementOf(saju.dayMaster)]`(기존 패턴)
- **접근성**: `prefers-reduced-motion` 존중 — 모션 축소 시 즉시 전환(연출 생략)

## i18n / 분석

- 신규 `TarotSpread` 메시지 네임스페이스, 4로케일(en/ko/ja/zh-TW): 제목/부제/버튼(과거·현재·미래·뽑기·공유·다시보기)/위치 라벨/로딩/디스클레이머
- `track` 이벤트: `spread_started` · `spread_card_drawn {position}` · `spread_revealed` · `share_clicked {kind:"tarot_spread"}`

## 테스트 (TDD)

- `tarot.ts` `drawSpread`: 3장 distinct · 모두 유효 카드 · 동일 `rng`면 동일 결과(결정성 주입 검증)
- API route: 키 없을 때 fallback JSON 4필드 형태/로케일
- `SpreadCardBack`: 렌더 smoke
- `SpreadDraw`: 버튼 시퀀스 게이팅(과거 먼저, 미완 시 다음 비활성), 3장 후 결과 노출
- `SpreadShareCard`: 3장 앞면 + 오행 액센트색
- 전 스위트 통과 + tsc/eslint clean + `next build` static(`/tarot/spread` 포함)

## 스코프 밖 (이번 사이클 제외)

- 크레딧/페이월 시스템 (다음 사이클 — 라우트 경계만 준비)
- 역방향(reversed) 카드 (업라이트 전용 유지)
- 리딩 결과 영구 저장/히스토리
- 오늘의 카드(`/tarot`)와의 통합/대체 (별개 유지)
