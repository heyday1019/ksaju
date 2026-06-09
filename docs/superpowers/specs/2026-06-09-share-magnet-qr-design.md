# 공유 카드 유입 마그넷 (브랜디드 QR 푸터) — 설계

> 사이클 22. 공유된 카드가 곧 유일한 유입 깔때기(백엔드 추적·리퍼럴 없음)라는 전제에서,
> 두 공유 카드(궁합·운세) 하단을 **낙관-중앙 브랜디드 QR + "Make yours →" CTA** 푸터로 교체해
> "나도 만들고 싶다"를 유발하는 마그넷으로 만든다.

- **날짜:** 2026-06-09
- **브랜치:** `feat/share-magnet-qr`
- **방향 결정 경로:** 다음 사이클 방향 = 성장·바이럴 레버 → 약한 고리 = 카드(유입 마그넷) →
  형태 = 낙관 스탬프 + CTA → 사용자가 만든 낙관 이미지로 **브랜디드 QR**(낙관 중앙 삽입) →
  적용 범위 = 두 카드 모두(공통 `ShareCardFooter`) → QR 대상 = `https://ksaju.me`(DNS 먼저 연결).

---

## 1. 목표 / 비목표

**목표**
- 공유 카드를 본 사람이 스캔(또는 타이핑)으로 곧장 `ksaju.me`에 도달하게 한다.
- 사용자가 직접 만든 낙관(사주 도장)을 브랜드 마크로 카드에 정식 편입한다.
- 궁합·운세 두 공유 표면에 **일관된** 마그넷 푸터를 적용한다(DRY).

**비목표 (스코프 규율)**
- 런타임 QR 생성·동적 URL·UTM/리퍼럴 추적 — 안 함(URL 고정이라 정적 1장이면 충분).
- 카드 본문(점수/리딩/운세 4카드) 재설계 — 안 함(푸터 교체 + 간격 미세조정만).
- 새 분석 이벤트 — 안 함(기존 `card_shared`만; 공유 텍스트 1줄만 변경).
- 헤더/OG 로고 교체, 사이트 전역 낙관 적용 — 이번 사이클 밖(향후 후보).

---

## 2. QR 에셋 — 1회 생성, 정적 커밋

`scripts/seed-idols.mjs`와 같은 "재사용 생성기 + 커밋된 산출물" 패턴.

**소스 자산**
- 사용자가 만든 낙관 `stamp-watermark2.png`(인주 빨강 + 井 격자 + 사주 한글)을
  `scripts/assets/stamp-saju.png`로 정리·커밋(소스 보존).
- ⚠️ 원본 우하단에 **메이커 워터마크 한 줄**이 있음 → 생성 스크립트에서 크롭.

**생성 스크립트 `scripts/gen-qr.mjs`** (`npm run gen:qr`)
1. `qrcode`로 `https://ksaju.me` QR 생성:
   - **에러정정 레벨 H**(~30% 여유 — 중앙 로고 가림 허용)
   - 모듈색 묵 `#1A1A2E`, 배경 흰색, margin 작게, 고해상(약 900×900).
2. `sharp`로 낙관 합성:
   - 낙관 PNG 워터마크 영역 크롭 → 정사각 트림.
   - QR **중앙 ~22% 영역**에, 낙관 뒤로 **흰/한지 둥근 패치**(스캔 보장용 여백)를 깔고 합성.
3. 출력 `public/ksaju-qr.png`(커밋되는 정적 에셋).

**의존성 규율**
- `qrcode`·`sharp`는 **devDependency**. 빌드/런타임은 커밋된 `public/ksaju-qr.png`만 참조 → **런타임 의존성 0**.
- URL이나 도장이 바뀌면 `npm run gen:qr` 재실행 후 산출물 재커밋.

**생성 후 1회 육안 검증**: 워터마크 제거 깔끔한지 + 폰 카메라로 실제 스캔되는지(에러정정 H 확인).

---

## 3. 공통 `ShareCardFooter` 컴포넌트

**신규** `src/components/share/share-card-footer.tsx`
- 순수 프레젠테이션. props 없음(또는 최소). 렌더:
  - QR `<img src="/ksaju-qr.png">` — **자체 밝은 둥근 패널** 위에 올려 카드 테마(라이트/다크)와 무관하게 스캔 대비 보장. `width≈96`, `alt="Scan to make your own at ksaju.me"`.
  - `Make yours →`(primary, 강조) · `ksaju.me`(브랜드) · `For entertainment 🌙`(디스클레이머 유지).
- 두 카드의 기존 푸터 블록(`<div className="w-full pb-9"> ksaju.me / For entertainment 🌙 </div>`)을 이 컴포넌트로 교체.

**캡처 호환**: `html-to-image`의 `toBlob`은 캡처 시점에 same-origin 정적 이미지를 fetch→data URL 인라인하므로 `/ksaju-qr.png`는 그대로 캡처됨(폰트 대기는 기존 `document.fonts.ready` 유지). 추가 export 코드 불필요. (안전장치로 footer img를 eager 로드.)

---

## 4. 카드 레이아웃 조정

- 카드 9:16(360×640), `flex flex-col justify-between`. 푸터가 ~120px(QR+텍스트)로 커지면서
  중앙 콘텐츠와의 균형 변화 → 중앙 영역 `gap`/패딩을 소폭 줄여 **오버플로 없이** 맞춘다.
  - 궁합: 점수/라벨/리딩/미니사주.
  - 운세: 일간 히어로 + 4카드 리스트(가장 빡빡 — 우선 확인 대상).
- **dev 시각 확인 필수**: 라이트 + 다크(Cosmic) + 모바일 폭, 두 카드 모두. 미리보기=export 동일성 유지.

---

## 5. 공유 텍스트 (소소한 보너스)

- `CompatibilityModal`·`FortuneShareModal`의 `shareMeta.text`에 `Make yours at ksaju.me` 훅 반영
  (카드 마그넷과 캡션 일관). 예: 궁합 `You × {name}: {score}/100 — make yours at ksaju.me`.

---

## 6. 테스트 (TDD)

- **신규** `src/components/share/share-card-footer.test.tsx`(happy-dom + RTL):
  - QR `<img>`가 `alt`(/make your own/i)와 `src="/ksaju-qr.png"`로 렌더된다.
  - "Make yours" CTA · `ksaju.me` · `For entertainment 🌙` 텍스트가 보인다.
- **기존** `compat-share-card.test.tsx`·`fortune-share-card.test.tsx`: `ksaju.me`는 유지되므로 대체로 통과.
  푸터가 컴포넌트로 빠지면서 깨지는 단언만 footer 컴포넌트 기준으로 갱신(필요 시).
- QR 생성 스크립트는 1회성 에셋 생성이라 유닛테스트 비대상(seed 스크립트와 동일 취급).
  대신 `public/ksaju-qr.png` 산출물 존재만 가볍게 확인(선택).

---

## 7. 파일 변경 요약

- 신규: `scripts/gen-qr.mjs`, `scripts/assets/stamp-saju.png`, `public/ksaju-qr.png`,
  `src/components/share/share-card-footer.tsx`, `src/components/share/share-card-footer.test.tsx`.
- 수정: `src/components/compat/compat-share-card.tsx`(푸터 교체),
  `src/components/fortune/fortune-share-card.tsx`(푸터 교체),
  `src/components/compat/compatibility-modal.tsx`·`src/components/fortune/fortune-share-modal.tsx`(공유 텍스트),
  `package.json`(`gen:qr` 스크립트 + devDeps `qrcode`/`sharp`),
  기존 카드 테스트(필요분), `CLAUDE.md`/`task-log.md`(완료 기록).
- 정리(선택): repo 루트의 임시 잔재(`bi8Au.png`, `stamp-watermark*.png` 원본, `watermark.pen`,
  `palnet+token.jpg`, `C：temp*.json`)는 `scripts/assets/`로 편입되는 것만 남기고 `.gitignore` 또는 제거.

---

## 8. 의존성 · 리스크

- **DNS 의존성:** QR은 `ksaju.me` DNS 연결 후에만 라이브. 그 전 출하분은 스캔 실패 →
  **사용자 작업(ksaju.me DNS 연결)을 이 카드 배포 전 또는 직후 수행** 전제. (이미 사용자 작업 목록에 있음.)
- **스캔 신뢰도:** 화면→화면 스캔은 2번째 기기 필요(주 경로 아님) — 그래서 `ksaju.me` 타이핑용 텍스트를 QR과 **함께** 유지. 에러정정 H + 중앙 패치로 로고 가림에도 스캔 가능하게.
- **워터마크 크롭:** 생성 후 육안 확인. 실패 시 소스 도장 재가공.
- **devDeps 추가(`qrcode`/`sharp`):** 빌드·런타임 비참조(산출물만 사용) → 배포 영향 0.

---

## 9. 셀프 리뷰

- **플레이스홀더:** 없음. 모든 자산 경로·색·레벨·컴포넌트 경로 명시.
- **내부 일관성:** 범위(두 카드) ↔ 공통 `ShareCardFooter` ↔ 파일 요약 일치. QR 정적 1장 ↔ 런타임 의존성 0 일치.
- **스코프:** 단일 구현 플랜에 적합(에셋 생성 1 + 컴포넌트 1 + 와이어링 2 + 텍스트 2 + 테스트). 분해 불필요.
- **모호성:** "낙관 중앙 ~22%" / "에러정정 H" / "자체 밝은 패널" 명시로 해석 분기 제거. 레이아웃 미세조정은 dev 시각 확인 게이트로 수렴.
