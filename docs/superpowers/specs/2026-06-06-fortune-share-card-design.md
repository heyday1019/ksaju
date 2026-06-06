# 운세 공유 카드 (FortuneShareCard) — 사이클 17 설계 문서

> 작성일: 2026-06-06 · 상태: 승인됨 (브레인스토밍 통과)
> 맥락: 남은 로드맵 항목 #6. 운세(fortune) Share는 현재 **비활성 티저**("Share ✨ (soon)"). 사이클 13의 이미지 export 공통 기반을 운세에 재사용해 실제 9:16 공유 PNG를 출하한다.

## 한 줄 요약

'내 사주' 뷰의 운세 4카드(Money/Love/Career/This Year)를 **9:16 세로 공유 카드 PNG**로 내보낸다. 사이클 13의 export 엔진(`share-image.ts` + `useShareImage`)과 궁합 공유 패턴("본문=카드"인 미리보기 모달)을 그대로 재사용한다. 신규 데이터·신규 카피·엔진 변경 0.

## 원칙
- **재사용 우선:** export 엔진과 모달 패턴은 검증됨(궁합) → 운세에 미러링만. 신규 인프라 0.
- **결정적·오프라인:** 운세는 `fortune.ts` 규칙엔진(LLM 미사용)에서 결정적 산출 → 카드도 결정적.
- 톤: 영문·fun·라이트·건전(teen)·shippy. 카드는 "MY SAJU FORTUNE" 정체성 + 재미.

## 범위

### 포함
1. `src/components/fortune/fortune-share-card.tsx` (신규) — `FortuneShareCard` 전용 9:16 카드(360×640, @pixelRatio 3 → 1080×1920).
2. `src/components/fortune/fortune-share-modal.tsx` (신규) — `FortuneShareModal`(`CompatibilityModal` 미러). 본문=카드 + Share 버튼.
3. `src/components/fortune/fortune-section.tsx` (수정) — 비활성 Share 티저 → 활성 Share(모달 open) + 분석 이벤트.
4. 테스트: `fortune-share-card.test.tsx`(신규), `fortune-section.test.tsx`(갱신).

### 비포함
- export 엔진(`share-image.ts`/`use-share-image.ts`) 변경 — 손대지 않음.
- 궁합 컴포넌트 변경.
- 신규 운세 카피·신규 데이터 파일 — `fortune.ts` 엔진 그대로.
- 다국어(영문만). 런타임 LLM·API키·KV.

## 카드 구성 (`FortuneShareCard`)

`forwardRef<HTMLDivElement>`, `width:360, height:640`, `hanji-paper` 배경, self-contained 스타일(궁합 카드와 동일 — 모달 축소 미리보기와 export 이미지가 동일하게 렌더). 상→하:

1. 상단 changsal 밴드 (궁합 카드와 동일 스타일).
2. 아이브로: `MY SAJU FORTUNE` (uppercase, tracking-wider, text-primary).
3. **일간 히어로:**
   - `辛 Metal · You` — 일간 한자(큰 글씨) + 오행 라벨. (`dayMasterInfo(userSaju.dayMaster)` → char/element, `WUXING_META[element].label`)
   - 일주 한자 `辛卯` + fun 키워드 한 줄 (`DAY_MASTER_KEYWORDS`, `dayMasterInfo().keyword`).
4. **4운세 라인** (`calcFortune(userSaju, luck)` 내부 호출 → 4 FortuneCard):
   - 각 라인: 이모지 + 제목(Money/Love/Career/This Year) + `line` + **작은 tier 배지**(오행색, 인라인 FortuneCard의 `ACCENT` 패턴 차용 — `tierLabel`).
   - 월운 `subLine`은 **생략**(요약 카드 간결성).
5. `ksaju.me` 워드마크 + `For entertainment 🌙`.
6. 하단 changsal 밴드.

**props:** `{ userSaju: UserSaju; luck: CurrentLuck }`. `calcFortune`를 **내부 호출**(CompatShareCard가 `getReading`을 내부 호출하는 패턴 동일 — 보유 props로 충분, prop 스레딩 불필요).

## 모달 (`FortuneShareModal`)

`CompatibilityModal` 미러:
- `Dialog`/`DialogContent`(`hanji-paper max-w-[360px]`), sr-only `DialogTitle`/`DialogDescription`.
- 본문 = `<FortuneShareCard ref={cardRef} userSaju luck />` (미리보기 = export).
- `useShareImage(cardRef, { fileName: "ksaju-fortune.png", shareMeta: { title:"My KSaju fortune", text:"My saju fortune — ksaju.me" }, onShared })`.
- Share 버튼(`status==="rendering"` → "Creating…"), 에러 시 "Couldn't create image — try again", Close 버튼.
- **props:** `{ open, onClose, userSaju, luck, onShared? }`.

## 섹션 수정 (`FortuneSection`)

- 비활성 `Share ✨ (soon)` 버튼 → 활성 `Share ✨` 버튼(onClick → `setOpen(true)`).
- `useState` open 상태 + `<FortuneShareModal open onClose userSaju luck onShared=... />`.
- 분석: `onShared={(method) => track("card_shared", { kind: "fortune", method })}` (사이클 15 일관 — `track`은 임의 props 허용, 타입 변경 불필요).
- `For entertainment 🌙` 캡션 유지.
- `"use client"` 유지(이미 client). `track` import 추가.

## 데이터 흐름

```
FortuneSection (userSaju, luck 보유)
  └─ Share 클릭 → FortuneShareModal(open)
       └─ FortuneShareCard(userSaju, luck)
            ├─ calcFortune(userSaju, luck) → 4 FortuneCard (결정적)
            └─ dayMasterInfo(userSaju.dayMaster) → 히어로
       └─ useShareImage → nodeToPngBlob(@3x) → Web Share / download
            └─ onShared(method) → track("card_shared", {kind:"fortune", method})
```

신규 데이터 파일 0. 신규 카피 0. 엔진 변경 0.

## 테스트 (vitest + happy-dom)

- `fortune-share-card.test.tsx`: 알려진 `userSaju`+`luck`로 렌더 → (a) 일간 히어로(오행 라벨), (b) 4운세 제목 4종, (c) 최소 1개 tier 배지, (d) `ksaju.me`, (e) `For entertainment` 노출. (compat-share-card.test 미러)
- `fortune-section.test.tsx`(갱신): 기존 "Share 버튼 disabled" 단언 → **"Share 버튼 활성"** 으로 교체 + 클릭 시 모달 카드 노출(운세 제목 재등장).
- 전체 스위트 그린.

## 검증

- `npm test` 그린(신규 카드 테스트 + 갱신 섹션 테스트).
- `npx tsc --noEmit` clean, `npm run lint` 신규 경고 0(기존 2건만).
- `npm run build` 성공(전 라우트 static — `html-to-image`는 client-only).
- 수동 시각 검증: '내 사주' 결과 → Your Fortune 섹션 Share ✨ → 모달 9:16 카드(일간 히어로·4운세·tier 배지·ksaju.me) → Share PNG(~1080×1920, 한글/한자 글리프 정상) / 다크·모바일.
- 분석: `card_shared { kind:"fortune" }` 이벤트로 운세 공유율 측정(사이클 15 PostHog).

## 비목표 가드

- export 엔진·궁합 컴포넌트 변경 금지.
- 신규 운세 카피/데이터 파일 금지(fortune.ts 재사용).
- 영문 외 다국어 금지(v1).
- subLine(월운) 카드 노출 금지(요약 간결성 — 인라인 섹션엔 유지).
