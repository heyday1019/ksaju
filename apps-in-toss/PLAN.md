# 10/22 노출 정책 개편 대비 정비 계획

> 작성 2026-10-07 · 대상 `apps-in-toss/` (K사주타로, miniAppId 77288)
> 상태: **Phase 1 구현 완료** (2026-10-07, 번들 `20261007-15`). 아래 체크리스트 참고.

---

## 0. 결론 먼저

지시받은 A~E 중 **실제로 해야 하는 것은 3개**다. 나머지는 이미 돼 있거나,
존재하지 않는 빌드 타깃을 전제한다.

| | 항목 | 판정 | 이유 |
|---|---|---|---|
| **C** | ReviewPort (`Review.request` + 빈도 제한) | **한다** | 10/22 기준에 '리뷰'가 직접 들어간다. 지금 호출부가 0개 |
| **E1** | 배너 ↔ 탭바 24px 이격 | **한다** | 지금 간격 0 — 정책 위반이고 오클릭 유발 |
| **B-부분** | `config/ads.ts` 로 광고 ID 1곳 관리 + env 주입 | **한다** | 지금 `App.tsx` 에 라이브 ID 하드코딩 |
| A | AnalyticsPort + 2개 어댑터 | **조정** | 포트 역할은 `lib/analytics.ts` 가 이미 함. 어댑터 2개는 스탠드얼론 빌드가 있어야 의미가 생김 |
| B-전면/보상형 | 전면·보상형 광고 신설 | **보류 권고** | 이 앱에 없는 기능이다. 정책 대비가 아니라 수익화 신설이고, **10/22 직전에 올릴 위험이 크다**(아래 0.1) |
| D1~D3 | 첫화면 동의창 / 전면광고 사전안내 / 중복광고 | **이미 충족 또는 무효** | 동의창 자체가 없고, 전면광고가 없어 D2·D3 은 성립하지 않음 |
| D4 | 샘플·TODO 문구 | **이미 깨끗** | 아래 3.4 |
| E2~E4 | 주기 갱신 / 클릭보상 / 라벨변경 | **이미 깨끗** | 아래 3.5 |

### 0.1 전면·보상형 광고를 지금 넣지 말자는 근거

이 앱은 **광고 노출 타이밍으로 두 번 반려된 이력**이 있다.

- `20260919-7` — "유저가 예상하기 어려운 시점에 광고가 노출돼요"
- `20260919-6`·`-7` — "최초 접속 20초 초과" (실제 원인이 광고 SDK였다)

승인된 현재 구성은 "첫 화면 외부요청 0건 + 배너는 사주 결과 뒤에만"이고,
직전 릴리즈 노트에서 심사팀에 **"광고 노출 방식은 직전 승인 버전과 동일합니다"**
라고 명시해 통과했다. 10/22 심사를 15일 앞두고 전면광고를 신설하면 이 근거가 사라진다.

전면·보상형은 10/22 이후, 등급이 확정된 다음에 별도 사이클로 올리는 것을 권한다.
지금 하려면 말씀해 주시면 그때 계획을 다시 쓴다.

---

## 1. 스펙 전제 vs 리포 실제

지시문이 가정한 구조가 이 리포와 다르다. 확인한 사실만 적는다.

| 스펙 전제 | 실제 | 확인 방법 |
|---|---|---|
| DATA / ENGINE / ROUTER + ports/adapters (dk-toy lineage) | `src/{lib,components,screens,state,content}` 평면 구조. `ports/`·`adapters/`·`config/` 없음 | `ls -d src/ports src/adapters src/config` → 없음 |
| pnpm | npm (`package-lock.json`) | `pnpm-lock.yaml` 없음 |
| 스탠드얼론 Capacitor 빌드 | 없음. 빌드 타깃은 토스 하나 | `package.json` 에 capacitor 의존성 0 |
| 전면형·보상형 광고 | 배너만 | 2절 지도 |
| `Review.request` / `Notification.requestAgreement` 사용 중 | 둘 다 호출부 0개 | 2절 지도 |

→ **"스탠드얼론 빌드에서 토스 SDK import 시 빌드 실패"** 라는 불변 규칙도 지금은
걸 대상이 없다. eslint 규칙 자체는 미래 대비로 넣을 수 있으나, 그러려면 먼저
스탠드얼론 엔트리가 있어야 한다. 5절 '승인 필요' 참고.

---

## 2. 호출부 지도 (광고 · 분석 · 리뷰 · 스토리지)

SDK 호출은 **전부 동적 `import()`** 이고, 파일 단위로 이미 좁게 모여 있다.

### 광고
- `src/components/ads/BannerAd.tsx:36` — `TossAds.initialize` (전역 1회, 뮤텍스 있음)
- `src/components/ads/BannerAd.tsx:80` — `TossAds.attachBanner`
- `src/App.tsx:17` — `BANNER_AD_GROUP_ID = "ait.v2.live.14d7a4538d864d74"` ← **라이브 ID 하드코딩**
- `src/App.tsx:133` — `{active && <BannerAd …/>}` 노출 게이트

### 분석
- `src/lib/analytics.ts:38` — `Analytics[kind]` (`screen`/`impression`/`click`)
  - 사실상 포트 역할을 이미 한다: 외부에 노출하는 것은 `logScreen`/`logSajuResult`/
    `logCompatResult`/`logTarotResult`/`logShareSaved` 5개 함수뿐이고,
    SDK 타입이 밖으로 새지 않으며, 실패를 삼켜 화면을 막지 않는다.

### 리뷰
- **없음.** `requestReview` / `Review.request` 호출부 0개.

### 스토리지 (전부 브라우저 `localStorage` 직접 호출)
- `src/state/profiles.ts:17,26,44` — `ksaju.toss.profiles.v1` / `…activeProfile.v1` / 레거시 키
- `src/lib/promotion.ts:87,105,115` — `ksaju.promo.v1:{hash}` 프로모션 원장

> `localStorage` 를 그대로 쓰는 것은 **의도된 선택**이다. SDK 3.1.1 이상은 2.x 와
> 동일 Origin(`ksaju.apps.tossmini.com`)이라 데이터가 보존된다(공지 53009 버전별 표).
> `Storage` API 로 옮기면 동기 → 비동기가 되어 `loadProfiles()` 호출부 전체가 번진다.
> 이번 작업에서는 **C 항목의 리뷰 기록만** `Storage` 를 쓴다(신규 데이터, 호출부 없음).

---

## 3. 사전 확인 결과

### 3.1 SDK 버전 — 조치 불필요

```
@apps-in-toss/web-framework  3.5.0   (package.json: ^3.5.0)
```

지시문의 "3.1.1 미만이면 마이그레이션 계획 먼저" 조건에 **해당하지 않는다.**
2.9.2 → 3.5.0 전환은 이미 끝났고 라이브다.

- 번들 `20260924-14`, 검수 APPROVED, **9/26 출시**, `isSdk3Deployed: true`
- 3.0.0~3.1.0 의 Origin 변경 구간은 건너뛰었다 (3.5.0 은 2.x 와 동일 Origin)
- 부수 효과: `.ait` 4.14MB → 0.28MB (2.x 가 싣던 RN 런타임·소스맵 3.52MB 제거)

### 3.2 API 시그니처 — 설치된 3.5.0 `dist/index.d.ts` 에서 직접 확인

플러그인 스킬 문서(`appintoss-docs`)는 **SDK 2.0.1 · `granite.config.ts` 기준으로 낡았다**
(3.x 에서 삭제된 `brand.displayName` 을 필수로 안내한다). 그래서 스킬 문서를 근거로
쓰지 않고, 설치된 타입 정의를 1차 근거로 삼았다.

| API | 3.5.0 실제 시그니처 | 비고 |
|---|---|---|
| `Analytics.log` | `(params: EventLogParams) => Promise<void>` | **3.5.0 에는 있다.** 코드 주석의 "3.x 문서의 `Analytics.log` 는 여기 없다"는 2.9.2 시절 기준 → 정정 대상. `params` 에 **`anonymous_key` 가 자동 포함**되고 `undefined` 는 제거 후 string 정규화. Toss 5.208.0+ |
| `Analytics.screen` | `(params?: LoggerParams) => Promise<void> \| undefined` | 현재 사용 중 |
| `Review.request` | `(() => Promise<void>) & { isSupported(), MIN_TOSS_APP_VERSION }` | **인자가 없다.** Toss Android/iOS **5.253.0+**. → momentKey·빈도 제한은 **우리가 만들어야 한다** |
| `Notification.requestAgreement` | `(params: RequestNotificationAgreementOptions) => () => void` | 반환값은 **cleanup 함수**. `templateCode`(콘솔 스마트발송 템플릿) 필요. 5.255.0+. ⚠️ 공지 52717 "스마트 발송의 광고·푸시 알림 운영 종료" 와 충돌 가능 → 쓰기 전 확인 필요 |
| `Storage` | `getItem(key) => Promise<string\|null>`, `setItem`, `removeItem`, `clearItems`, `getItems(keys)`(5.270.0+) | **전부 async** |
| `TossAds.attachBanner` | `(adGroupId, element, options) => { destroy() }` | `attach` 는 **@deprecated** — 우리는 이미 `attachBanner` 사용 중 ✅ |
| `loadFullScreenAd` | `({ options?: { adGroupId }, onEvent, onError }) => () => void` | `onEvent`: `{type:"loaded"}` 만 |
| `showFullScreenAd` | `({ options?: { adGroupId }, onEvent, onError }) => () => void` | `onEvent`: `clicked`/`dismissed`/`failedToShow`/`impression`/`show`/`userEarnedReward`. `options` 는 v2 호환으로 옵셔널이지만 **생략하면 네이티브가 에러**를 준다 |

3.x 는 도메인 네임스페이스 8개를 노출한다 — `Analytics` `Device` `Notification`
`Review` `Share` `Storage` `TossAds` `User`. 평면 함수(`requestReview`,
`requestNotificationAgreement` 등)도 **같이 남아 있어** 기존 코드가 그대로 돈다.

### 3.3 첫 화면 동의창 (D1) — 이미 충족

`appLogin` · `requestNotificationAgreement` · `requestPermission` 호출부가 0개다.
사진첩 권한은 `permissions` 선언만 있고 **저장 버튼을 눌렀을 때** 실제 요청이 나간다.
첫 화면은 생일 입력 폼이고 외부 요청 0건이다.

### 3.4 샘플 · TODO 문구 (D4) — 이미 깨끗

`TODO|FIXME|XXX|lorem|샘플|임시|placeholder|dummy|테스트용` 전수 검색 결과,
남은 것은 정상 입력 힌트 2개뿐이다.

- `BirthForm.tsx:99` `placeholder="예: 나, 민지"`
- `IdolPicker.tsx:14` `placeholder="아이돌 검색 (이름)"`

### 3.5 정책 가드 (E) — 1건만 위반

| 항목 | 상태 |
|---|---|
| 같은 화면에 같은 형식 광고 2개 | ✅ 배너 1개뿐 |
| 배너 주기적 새로고침 코드 | ✅ 없음 (SDK 자동갱신만 사용, `everRendered` 로 노필 접힘 방지) |
| 광고 클릭 시 보상 | ✅ 없음. 프로모션 보상은 미션(사주 확인/공유) 완료에만 연결 |
| 광고 라벨·색상·CTA 임의 변경 | ✅ '광고' 라벨을 소재보다 **먼저** 렌더, `tone`/`variant` 는 SDK 옵션 사용 |
| **탭·버튼에서 24px 이격** | ❌ **위반** — `App.tsx:132-133` 에서 `TabNav` 바로 아래에 배너가 **간격 0** 으로 붙어 있다 |

### 3.6 참고: 현재 실사용 지표 (10/22 기준 중 '실사용')

전환 지표 3개는 9/25부터 집계되고 있다. 최근 7일(9/30~10/6):

| 지표 | 7일 합 | 일별 |
|---|---|---|
| 내 사주 결과 확인 (**대표**) | 104 | 20·13·12·13·17·22·7 |
| 오늘의 타로 확인 | 27 | 5·4·4·1·1·9·3 |
| 공유 카드 저장 | **5** | 1·0·0·1·0·3·0 |

**공유 저장이 사주 결과의 4.8%** 다. 바이럴이 사실상 작동하지 않는다.
이번 정비 범위는 아니지만 10/22 전에 따로 볼 가치가 있다.

> 미확인: **활성 지표**는 MCP 로 조회·설정이 모두 막혀 있어(`core_metric_*` 엔드포인트
> 미등록) 설정 여부를 코드/콘솔 API 어느 쪽으로도 확인할 수 없다. 콘솔 웹에서 확인 필요.
> **리뷰 수·평점**도 `miniapp_rating_get`/`_list` 가 미등록이라 조회 불가.

---

## 4. 작업 계획

### C. ReviewPort — `requestReviewAt(momentKey)` ⭐ 최우선

`Review.request()` 는 인자가 없고 빈도 제한도 없다. 남용하면 역효과이므로 우리가 건다.

- [x] `src/lib/review.ts` 신설
  - [ ] `requestReviewAt(momentKey: ReviewMoment): Promise<void>`
  - [ ] `Review.request.isSupported()` 체크 → 미지원(5.253.0 미만)이면 조용히 no-op
  - [ ] 동적 `import()` (정적 import 는 웹 크래시 + 반려)
  - [ ] 같은 `momentKey` 는 **기기당 1회**
  - [ ] 전체 요청은 **30일에 1회** 상한
  - [ ] 기록은 SDK `Storage` 사용 (async, 신규 데이터라 기존 호출부에 영향 없음)
  - [ ] 저장 실패·미지원은 전부 삼킨다 — 리뷰 요청이 화면을 막아선 안 된다
- [ ] 호출 지점 (만족도가 가장 높은 순간에만, 첫 진입에는 절대 안 붙인다)
  - [ ] `share_saved` 성공 직후 — `momentKey: "share_saved"`
  - [ ] 프로모션 미션 전체 완료 직후 — `momentKey: "promo_done"`
- [x] `src/lib/review.test.ts` — momentKey 1회, 30일 상한, 미지원 no-op, Storage 실패 내성

### E1. 배너 이격 24px

- [ ] `App.tsx` 하단 독에서 `TabNav` 와 `BannerAd` 사이 **24px 이상** 확보
- [x] 본문 `pb-60` 재계산 (탭바 + 간격 + 배너 96px + safe-area)
- [ ] `App.test.tsx` 에 간격 회귀 테스트 추가

> 주의: 과거 세로 스크롤이 죽은 이력이 있다. `overflow-x: hidden`,
> `touch-action: pan-y`, `webView` 스크롤 3종은 **건드리지 않는다**(README 기록).

### B-부분. 광고 ID 중앙화

- [x] `src/config/ads.ts` 신설 — 광고 ID의 유일한 출처
  - [ ] 프로덕션 ID 는 `import.meta.env.VITE_BANNER_AD_GROUP_ID` 로 주입
  - [ ] env 없으면 **테스트 ID로 폴백** (dev 빌드가 라이브 ID를 절대 쓰지 않게)
  - [ ] `App.tsx:17` 하드코딩 제거
- [ ] `.env.production` 에 실 ID, 저장소에는 테스트 ID만 커밋
- [ ] 배너 퍼널 dev 로그: `request`/`loaded`/`failed(reason)`
      — `import.meta.env.DEV` 가드. 프로덕션 콘솔에는 아무것도 남기지 않는다
      (전면/보상형이 없으니 `show_attempt`/`shown` 은 해당 없음)

> 광고 ID 를 env 로 빼면 **빌드 설정 실수 시 배너가 조용히 테스트 ID로 나갈** 위험이
> 생긴다. 그래서 빌드 산출물에 들어간 ID 를 확인하는 단계를 QA 에 넣었다(6절).

### A. AnalyticsPort — 조정안

`lib/analytics.ts` 가 이미 포트다(2절). 어댑터를 2개로 쪼개는 것은 스탠드얼론
빌드가 생길 때 의미가 있다. 지금 하면 파일만 3개 늘고 동작은 같다. 그래서:

- [ ] 명시적 인터페이스만 추가 — `logEvent(name, params)` / `logScreen(name)` 를
      `analytics.ts` 가 공개하는 계약으로 문서화 (기존 5개 래퍼는 그 위에 유지)
- [ ] 주석 정정: "3.x 문서의 `Analytics.log` 는 여기 없다" → 3.5.0 에는 있다
- [ ] `Analytics.log` 가 `anonymous_key` 를 자동 포함한다는 사실을 주석에 남긴다
      (우리가 PII 를 넣지 않는다는 원칙과 별개로, 익명키는 SDK 가 붙인다)
- [ ] **로그 이름은 바꾸지 않는다** — 콘솔 전환 지표 3개가 이 문자열에 묶여 있고
      대표 지표는 삭제할 수 없다. 이름을 바꾸면 10/22 전환율이 0이 된다
- [ ] 어댑터 분리·noop 어댑터·eslint `no-restricted-imports` 는 **스탠드얼론 엔트리가
      생기는 시점으로 이월** (5절 질문 1)

### D. UX 가드

- [ ] D1 첫화면 동의창 — 확인 완료, 변경 없음 (3.3)
- [ ] D2 전면광고 사전 안내 — 전면광고 없음 → **해당 없음**
- [ ] D3 광고 본 결과 화면 중복 광고 — 전면광고 없음 → **해당 없음**
- [ ] D4 샘플·TODO 문구 — 확인 완료, 변경 없음 (3.4)

### E. 정책 가드 나머지

- [ ] E2 주기 갱신 코드 — 없음 확인, 변경 없음
- [ ] E3 클릭 보상 — 없음 확인, 변경 없음
- [ ] E4 라벨·CTA — 준수 확인, 변경 없음

---

## 5. 승인이 필요한 결정

1. **스탠드얼론(Capacitor) 빌드를 실제로 만들 계획이 있나?**
   없다면 A 의 어댑터 2분할과 eslint `no-restricted-imports` 는 넣지 않는다.
   있다면 별도 사이클로 엔트리부터 만든다.
2. **전면·보상형 광고를 지금 넣을까?**
   0.1 의 이유로 10/22 이후를 권한다.
3. **알림 동의(`Notification.requestAgreement`)를 쓸까?**
   공지 52717 이 스마트발송 푸시 운영 종료를 알렸다. `templateCode` 가 필요한 API 라
   종료 영향을 먼저 확인해야 한다. 이번 범위에서는 빼는 것을 권한다.
4. **활성 지표**가 콘솔에 설정돼 있나? MCP 로 확인이 안 된다.
   안 돼 있으면 10/22 전에 콘솔 웹에서 설정이 필요하다.

---

## 6. 수동 QA 시나리오 (실기기, 승인 후 수행)

전부 **실기기 QR** 로 확인한다. 롤백 불가 구간은 아니지만 광고·결제·리뷰는
브라우저 mock 과 실제 동작이 갈린다.

1. **첫 진입** — 생일 입력 폼이 바로 뜨고, 동의창·로그인창·광고가 **하나도** 없다
2. **배너 이격** — 사주 결과 후 배너가 뜨고, 탭 버튼과 24px 이상 떨어져 있다.
   탭을 연타해도 배너가 눌리지 않는다
3. **배너 라벨** — 소재보다 '광고' 라벨이 먼저 보인다
4. **세로 스크롤** — 사주 결과 화면이 끝까지 스크롤된다 (과거 회귀 지점)
5. **광고 ID** — `dist/assets/*.js` 에서 라이브 ID(`…14d7a4538d864d74`)가 **프로덕션
   빌드에만** 들어가고 dev 빌드에는 테스트 ID가 들어갔다. `grep` 으로 확인
6. **리뷰 요청 (1회차)** — 공유 카드 저장 성공 직후 리뷰 시트가 **1번** 뜬다
7. **리뷰 요청 (2회차)** — 같은 동작을 다시 해도 시트가 **다시 뜨지 않는다**
8. **리뷰 요청 (다른 moment)** — 프로모션 완료 시점에도 30일 상한에 걸려 뜨지 않는다
9. **리뷰 미지원 단말** — 5.253.0 미만에서 아무 일도 일어나지 않고 화면이 멀쩡하다
10. **기존 데이터** — 저장된 사주 프로필과 프로모션 참여 기록이 그대로 남아 있다

---

## 7. 완료 기준

- [ ] `npm run build` 통과 (`tsc -b && vite build && ait build`)
- [ ] `npm test` 통과 (현재 66 → 신규 테스트 추가분 포함)
- [ ] `.ait` 용량이 0.28MB 수준에서 유지 (초기 청크 213KB 이하)
- [ ] dev 빌드에서 배너 퍼널 로그 `request`/`loaded`/`failed` 확인
- [ ] 6절 QA 10항목 전부 통과
- [ ] 변경 파일 목록과 QA 결과를 `CHANGELOG.md` 에 기록
- [ ] 커밋은 항목별로 분리 (C / E1 / B-부분 / A-주석)
