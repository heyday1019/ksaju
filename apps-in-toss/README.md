# K사주타로 — Apps in Toss 미니앱

KSaju 사주 엔진을 재사용한 **앱인토스(Apps in Toss) WebView 미니앱**.
한국어 전용 · 외부통신 0 · 오프라인 결정적.

본 메인 레포(`ksaju.me`)와 완전히 독립된 Vite + React SPA 입니다. `src/lib`·`src/data` 는
메인 레포에서 **복사**한 순수 로직 엔진/데이터이며, 크로스 import 없이 자체 `node_modules`로 동작합니다.

## 콘솔 등록 정보

| 항목 | 값 |
|---|---|
| 워크스페이스 | Blue ICE (`53459`) |
| miniAppId | `77288` |
| App ID (`appName`) | `ksaju` |
| 서비스 링크 | `intoss://ksaju` |
| 카테고리 | 생활 > 콘텐츠 > 운세 |
| 콘솔 홈 | https://apps-in-toss.toss.im/workspace/53459/mini-app/77288/home |

## 기능 (4화면)

- **내 사주** — 생일 입력 → **오늘의 운세 한 줄** + 사주 4기둥(한자·오행색) + 오행 밸런스
  + fun 운세 4카드 + 9:16 공유 카드
  - 오늘의 운세는 일간과 **오늘 일주 천간**의 관계(`stemRelation`)로 기운을 정하고,
    `(일간 × KST 날짜)` FNV-1a 해시로 문장·행운색을 고른다(`src/lib/daily.ts`).
    웹앱은 같은 자리에 LLM 을 쓰지만 여기서는 외부통신 0 원칙대로 규칙으로 만든다.
    웹앱 폴백처럼 관계당 문장 하나면 매일 같은 말이 나오므로 관계별 풀을 둔다.
  - **사주 프로필 여러 개** — 나·친구·연인을 이름과 함께 저장하고 칩으로 전환(`src/state/profiles.ts`).
    예전 단일 저장본(`ksaju.toss.userSaju.v1`)은 첫 로드에서 '나' 프로필로 자동 이관된다.
- **궁합** — K-pop 아이돌 **또는 친구·연인**(저장된 프로필 선택 / 생일 직접 입력) + 9:16 공유 카드
- **오늘의 타로** — 사주+날짜 결정적 1장 + 덱 아트 + 한국어 리딩 + 9:16 공유 카드
- **타로 스프레드** — 과거·현재·미래 3장 + 종합 해석

## 하단 배너 광고

앱인토스 인앱광고 2.0 배너. 지면 ID 는 `src/App.tsx` 의 `BANNER_AD_GROUP_ID`.

이 앱은 **배너만** 쓴다(전면형·보상형 없음). 그래서 광고 코어의 슬롯 중재(배너 vs 전면형
직렬화)가 필요 없고 `src/components/ads/BannerAd.tsx` 하나로 끝난다. 지켜야 할 것:

- 호출 전 `TossAds.initialize.isSupported()` — 토스 앱 밖(웹·샌드박스)에서는 아무것도 렌더하지 않는다
- 컨테이너 `width:100%` + 고정형 `height:96px`, 부착 엘리먼트 내부는 비워둔다
- 노필·렌더실패로 한 번도 못 뜬 슬롯은 접는다(빈 여백 금지). 한 번 떴던 슬롯은 유지(SDK 자동갱신)
- 배너를 **가리거나 겹치지 않는다** — 하단 도크에서 탭바를 배너 위에 쌓고 본문은 `pb-56` 으로 자리를 비운다

## 이벤트 로그와 전환 지표

2026-10-22 부터 토스 노출 정책이 등급제(출시 / 추천 / 부스팅)로 바뀐다. **추천** 선정 기준의
하나가 전환율이고, 그 전환율은 콘솔 '핵심 지표'에 등록한 **전환 지표**로 계산한다.
이 앱은 그전까지 커스텀 로그가 하나도 없어서(`/::screen` 과 플랫폼 자동 로그뿐) 전환율을
낼 수 없었다. `src/lib/analytics.ts` 가 그 구멍을 메운다.

SDK 가 주는 것은 `Analytics.screen / impression / click` 세 개다.
**콘솔 카탈로그에는 `log_name` 이 그대로 쌓인다 — `::impression` 같은 접미사는 붙지 않는다.**
(한때 `{log_name}::{type}` 으로 적어뒀는데 틀린 추측이었다. 2026-09-24 실제 수집분으로 확인.
플랫폼 자동 로그만 `appsintoss_app_visit::impression__…` 처럼 `::` 를 쓴다.)

| 호출 | 콘솔 로그 이름 | logType | 뜻 |
|---|---|---|---|
| `logScreen(tab)` | `saju` `compat` `tarot` `spread` | SCREEN | 탭 진입. 단일 라우트라 탭별 사용량이 안 보였다 |
| `logSajuResult()` | `saju_result` | EVENT | 생일 입력 → 4기둥 결과 도달. **대표 전환** |
| `logCompatResult(kind)` | `compat_result` | EVENT | 궁합 결과 확인 (`kind`=idol/person) |
| `logTarotResult()` | `tarot_result` | EVENT | 오늘의 타로 확인 |
| `logShareSaved(card, how)` | `share_saved` | EVENT | 공유 카드 **저장 성공**(모달 열기와 구분) |

등록된 전환 지표(2026-09-24, `event_act_type_set` 으로 생성):
`saju_result`(대표) / `share_saved` / `tarot_result`.
**활성 지표(ACTIVATION)는 MCP 로 조회·설정할 수 없다 — 콘솔 웹에서만 된다.**

지켜야 할 것:

- **로그 이름을 바꾸면 콘솔 전환 지표가 조용히 0이 된다.** 지표의 `eventName` 이 이 문자열에
  묶여 있다. `analytics.test.ts` 가 이름을 고정해 둔다. 대표 지표는 삭제할 수 없다
- SDK 는 반드시 동적 import (정적 import 는 웹에서 크래시 + 심사 반려. 배너와 같은 이유)
- 생일·이름 같은 개인정보는 파라미터에 넣지 않는다 (외부통신 0 원칙)
- 테스트는 `src/test-setup.ts` 에서 SDK 를 통째로 mock 한다. 실제 번들을 끌어오면 브리지도
  없으면서 변환 비용만 얹혀 전체 실행이 타임아웃한다(실제로 App.test 가 단독으론 통과하는데
  전체에선 깨졌다)

**콘솔 등록은 배포 이후에 한다.** 수집된 적 없는 이름으로 지표를 만들면 값이 영원히 0이고,
대표 지표는 나중에 삭제할 수도 없다. 배포 → 콘솔 로그 카탈로그에 이름이 뜨는지 확인 → 등록 순서.

## 디자인 자산

`src/assets/` 의 3개 파일은 `scripts/gen-assets.mjs` 가 만들어 커밋한 것이고,
런타임/빌드는 커밋된 파일만 참조한다(런타임 의존성 0).

| 파일 | 출처 | 크기 |
|---|---|---|
| `hanji-bg.webp` | 메인 레포 `public/hanji-bg.png` (426KB PNG) | 15.6KB |
| `stamp.webp` | `public/app-icon-600.png` 을 160px 로 | 5.1KB |
| `hanja.woff2` | Noto Serif KR 에서 한자 43글리프만 서브셋 | 10.0KB |

**타로 덱은 번들에 싣지 않는다.** `ksaju.me/tarot-webp/` 에서 받아온다(장당 400px
WebP, 48KB). 카드 아트는 첫 화면에 필요 없는 자산인데(타로는 4개 탭 중 3번째)
번들에 넣으면 '최초 접속 시간'에 통째로 얹힌다 — 240px 로 줄여도 1.4MB 였고,
로딩 시간으로 세 번 반려됐다. 원격으로 돌리니 최초 접속에는 0 이 되고 실제로
보는 1~4장만 받는다(실측: 첫 화면 0장, 타로 탭 1장).

- 이미지는 `crossOrigin="anonymous"` 로 받는다. 공유 카드를 html-to-image 로
  캡처할 때 CORS 없이 받은 이미지는 캔버스를 오염시켜 PNG 저장이 실패한다.
  헤더는 메인 레포 `next.config.ts` 가 `/tarot-webp/:path*` 에 붙인다.
- 못 받으면 카드 자리를 접고 이름만 남긴다 — 타로는 사주+날짜로 로컬에서
  결정되므로 아트가 없어도 기능은 동작한다.
- 덱을 바꾸려면 메인 레포 `public/tarot-webp/` 를 갱신하고 웹앱을 **먼저** 배포해야
  한다. 미니앱을 먼저 올리면 심사자가 깨진 카드를 본다.


## `.ait` 용량 예산 — 로딩 시간 반려의 실체

심사의 "최초 접속 20초 초과"로 **네 번 반려됐다.** 그 과정에서 얻은 결론 두 가지를
순서대로 적어둔다. 둘 다 비싸게 배운 것이다.

**1) 용량은 주원인이 아니었다.** 7.76 → 5.58 → 4.13MB(-47%) 로 줄이는 동안 반려 문구가
한 글자도 바뀌지 않았다. 판정을 가른 건 **광고 SDK** 였다 — 용량이 똑같은 두 번들에서
배너를 첫 화면에 둔 쪽은 반려, 사주 결과 뒤로 미룬 쪽은 승인됐다.
**로딩 시간 지적을 받으면 용량보다 먼저 "첫 화면에서 네트워크를 붙잡는 것"을 의심할 것.**
그렇다고 초기화를 `requestIdleCallback` 으로 미루면 이번엔
"유저가 예상하기 어려운 시점에 광고가 노출돼요"로 반려된다(실제 이력).
정답은 지연이 아니라 **배치** 다 — 첫 화면에서 빼고, 라벨과 자리는 즉시 그린다.

**2) 남은 용량의 85%는 SDK 2.x 였고, 3.x 로 옮기며 사라졌다.**

| | 2.9.2 | 3.5.0 |
|---|---|---|
| `.ait` | 4.14MB | **0.64MB** |
| RN 소스맵·런타임 | 3.52MB (85%) | 0 — 없어짐 |
| 내 웹 페이로드 | 0.60MB | 0.60MB |

2.x 의 `.ait` 에는 손댈 수 없는 RN 소스맵 4개(2.46MB)와 런타임(1.06MB)이 무조건 들어갔다.
3.x 는 내부 처리를 서버로 옮기면서 이 페이로드를 걷어냈다. 내 코드는 그대로인데 용량만 1/6.

`.ait` 는 앞에 13KB 헤더가 붙은 `AITBUNDL` 커스텀 컨테이너(순수 zip 아님)라
내용물만 손으로 재작성하면 포맷이 깨진다. 시도하지 말 것.

`public/` 에 둔 파일은 참조가 없어도 전부 번들에 실린다. 콘솔 아이콘 업로드용으로만 쓰던
`app-icon-600.png`(368KB)가 전체의 56%를 차지하고 있었다 — 아이콘은 콘솔에
`static.toss.im` URL 로 등록돼 있어 번들에 있을 필요가 없었다.

한글 명조는 싣지 않는다 — 상용 2350자만 담아도 수백 KB라 로딩 예산을 넘긴다.
한자만 명조(`.hanja`)로 쓰고 한글 본문은 시스템 폰트를 쓴다.
`.hanja` 가 웹앱처럼 Gowun Batang 을 먼저 부르지 않는 이유는, Gowun Batang 이
한글 전용이라 한자 글리프가 아예 없기 때문이다(웹앱도 실제로는 Noto 가 그린다).

## SDK 3.x (2026-09-24 전환)

`granite.config.ts` → `apps-in-toss.config.ts`, `brand` 는 `primaryColor` 만,
`webViewProps` → `webView`(`type` 삭제), `outdir` → `webBundleDir`,
`web.commands` → `package.json` 스크립트. `npx ait migrate v3` 가 주석까지 보존하며 해준다.
**호출부는 한 줄도 바꿀 필요가 없다** — 2.x 의 평면 함수(`getAnonymousKey`,
`grantPromotionReward`, `getSchemeUri`, `Analytics`, `TossAds` …)가 3.5.0 에도 그대로 있다.

**마이그레이션 가이드의 "localStorage 데이터가 사라진다" 경고는 3.0.0~3.1.0 한정이다.**
그대로 믿고 보류하면 안 된다. 공지 53009 의 버전별 Origin 표가 정확하다:

| SDK | 서비스 Origin |
|---|---|
| 2.x / **3.1.1 이상** | `ksaju.apps.tossmini.com` (동일) |
| 3.0.0 ~ 3.1.0 | `ksaju.web.tossmini.com` (달라짐 → 데이터 유실) |

3.1.1 이상은 Origin 이 2.x 와 같으므로 `localStorage` 가 보존된다.
사주 프로필(`ksaju.toss.profiles.v1`)과 프로모션 원장(`ksaju.promo.v1:{hash}`)이
여기 있으므로 이 사실이 전환 가능 여부를 갈랐다. `ait migrate` CLI 와 문서의 CORS 안내가
`web.tossmini.com` 을 말하는 것도 같은 이유로 낡은 정보다.

**한 번 3.x 로 출시하면 2.x 로 롤백할 수 없다.** 실기기 QR 테스트를 반드시 먼저 한다.

`@apps-in-toss/devtools` 가 devDependency 로 붙어 `npm run dev` 에 mock SDK 패널이 뜬다.
플러그인은 `apply` 가 없어 프로덕션 빌드에서도 **실행**되지만(빌드가 느려진다)
산출물에는 아무것도 넣지 않는다 — 확인함. 공식 경로에서 벗어나지 않으려고 그대로 뒀다.

## 제약 (설계 원칙)

- **외부통신/링크 0** — Supabase·PostHog·OpenRouter(LLM)·QR·ksaju.me·ko-fi 전부 없음. fetch 없음.
- **결정적·오프라인** — 같은 입력 → 같은 출력(타로 스프레드의 의도된 랜덤 제외). API 키 불필요.
- **한국어 전용** — 로케일 지원 엔진(`calcFortune`/`getReading`/타로 리딩)에 항상 `locale="ko"`.
- **라이트 한지 테마 전용**, primaryColor 진달래 `#C8385A`.

## 반려 이력과 대응 (2026-09-18, 1차 반려)

> 1. 앱 스킴 접속이 불가능해요. 2. 최초 접속 시간이 20초를 초과해요.

두 지적은 **같은 원인**이었다. `.ait` 안에서 웹 자산은 `web/` 하위에 담겨 https 오리진의
하위 경로로 서빙되는데, Vite 기본 `base: "/"` 로 빌드하면 `index.html` 이 `/assets/...` 를
오리진 루트에서 찾다가 404 → 흰 화면 → 무한 로딩이 된다.

- **`vite.config.ts` 의 `base: "./"` 를 절대 지우지 말 것.** 빌드 후
  `dist/web/index.html` 이 `./assets/...` 로 나오는지 확인한다.
- CSS 안의 자산도 같은 이유로 `public/` 이 아니라 `src/assets/` 에 둔다 —
  `public/` 의 절대 `url()` 은 Vite 가 재작성하지 않는다.
- 초기 청크는 **200KB 선**을 유지한다. 타로 덱 78장을 넣고도 그대로다. 무거운 모듈은 부팅 경로에서 빼둔 상태다:
  만세력(240KB)·html-to-image·궁합/타로 화면 전부 동적 import. 데이터 JSON 은
  **파일별로** 쪼갠다 — 한 덩어리로 묶으면 운세 i18n 하나 때문에 아이돌 DB(34KB)·
  타로(19KB)까지 사주 화면에서 받아간다.

## 앱인토스 심사 규칙 대응

코드를 고칠 때 아래를 깨뜨리지 않도록 주의합니다.

- **자체 헤더·백버튼·햄버거 메뉴 금지** — 앱 이름/로고/백버튼은 `navigationBar` 공통 UI가 그립니다.
  `App.tsx` 에 `<header>` 를 되살리지 마세요(`App.test.tsx` 가 막고 있습니다).
- **탭 전환은 `history.pushState`** — 공통 백버튼(= `history.back()`)이 이전 탭으로 돌아가고,
  최초 탭에서는 미니앱이 종료됩니다.
- **SDK 는 반드시 동적 `import()`** — 정적 import 는 브라우저에서 크래시하고 심사 반려 사유입니다.
  (`TossAds` 네임스페이스만 예외)
- **핀치줌 차단** — `index.html` viewport 의 `user-scalable=no` 만 쓴다.
- **세로 스크롤을 막는 것을 넣지 말 것** — 아래 셋은 실기기에서 스크롤이 죽어 되돌린 이력이 있다:
  `html/body { overflow-x: hidden }`(iOS WKWebView 세로 스크롤 사망), `body { touch-action: pan-y }`,
  `webView`(구 `webViewProps`) 의 `bounces`/`overScrollMode`/`pullToRefreshEnabled`.
  SDK 3.x 는 이 셋을 매니페스트에 기본값으로 항상 적는다(`bounces:true`,
  `overScrollMode:"always"`, `pullToRefreshEnabled:false`) — 2.x 에서 비워뒀을 때와
  같은 값이므로 그대로 두고, **직접 덮어쓰지 말 것**.
  좌우 스크롤 차단은 앱 루트의 `overflow-x: clip`(스크롤 컨테이너를 만들지 않는다)으로 한다.
- **`alert()`/`confirm()` 금지** — 피드백은 인페이지 `role="status"` 메시지로 처리합니다.
- **앱 이름 일치** — SDK 3.x 부터 `brand.displayName` 이 사라져 **내비바 이름은 콘솔 등록명**에서
  내려온다. 그래도 `index.html` 의 `<title>`·`og:title` 과 공유 카드 푸터는 번들 안에 남아 있으니
  콘솔 이름과 공백까지 같게(`K사주타로`) 유지한다. 한 곳만 어긋나도
  "미니앱 이름이 앱 정보등록에 제출된 이름과 동일해야 해요"로 반려된 이력이 있다.
  이름을 바꿀 때는 `grep -rn "K사주"` 로 전수 확인할 것 — 공유 카드 푸터를 빼먹기 쉽다.
- **이미지 저장** — WebView 에서 `<a download>` 는 동작하지 않습니다. `src/lib/share.ts` 의
  `saveShareCard` 가 토스 앱 안에서는 `saveBase64Data`(photos:write 권한)로 사진첩에 저장하고,
  브라우저에서만 다운로드로 폴백합니다.

## 개발

```bash
npm install        # React 19 peer 충돌 시: npm install --legacy-peer-deps
npm run dev        # http://localhost:5173 — AIT Devtools 패널이 붙은 mock SDK 환경
npm test           # vitest (66 tests)
npm run build      # tsc -b && vite build && ait build → dist/ + ksaju.ait
npm run gen:assets # 디자인 자산 재생성(1회용, sharp + python fonttools 필요)
```

> 환경 메모: Node 22(권장 24, 경고만). `@sentry/cli` postinstall이 Windows에서 실패하면
> `npm install --ignore-scripts`.

## 배포 절차

1. `npm run build` → `ksaju.ait` + `deploymentId` (`ait build` 가 빌드 스크립트에 포함돼 있다)
2. 콘솔 번들 업로드 → 컴파일 완료 대기
3. 테스트 푸시 → `intoss-private://…` 딥링크로 **실기기 테스트**
4. 실기기 확인 후 **검수 요청**
5. 검수 승인 후 콘솔 웹 '앱 출시' 화면에서 **출시하기** (이 단계는 웹에서만 가능)

— For entertainment 🌙
