# K사주 — Apps in Toss 미니앱

KSaju 사주 엔진을 재사용한 **앱인토스(Apps in Toss) WebView 미니앱**.
한국어 전용 · 외부통신 0 · 오프라인 결정적.

본 메인 레포(`ksaju.me`)와 완전히 독립된 Vite + React SPA 입니다. `src/lib`·`src/data` 는
메인 레포에서 **복사**한 순수 로직 엔진/데이터이며, 크로스 import 없이 자체 `node_modules`로 동작합니다.

## 기능 (4화면)

- **내 사주** — 생일 입력 → 사주 4기둥(한자·오행색) + 오행 밸런스 + fun 운세 4카드(금전/연애/직업/올해)
- **궁합** — K-pop 아이돌 검색·선택 → 궁합 점수 + 한국어 레이블 + 짧은 리딩 + 9:16 공유 카드(PNG)
- **오늘의 타로** — 사주+날짜 결정적 1장 + 한국어 리딩
- **타로 스프레드** — 과거·현재·미래 3장 + 종합 해석

## 제약 (설계 원칙)

- **외부통신/링크 0** — Supabase·PostHog·OpenRouter(LLM)·QR·ksaju.me·ko-fi 전부 없음. fetch 없음.
- **결정적·오프라인** — 같은 입력 → 같은 출력(타로 스프레드의 의도된 랜덤 제외). API 키 불필요.
- **한국어 전용** — 로케일 지원 엔진(`calcFortune`/`getReading`/타로 리딩)에 항상 `locale="ko"`.
- **라이트 한지 테마 전용**, primaryColor 진달래 `#C8385A`.
- 공유는 로컬 PNG **다운로드 폴백**(토스 web-framework 공개 네이티브 공유 API 없음).

## 개발

```bash
npm install        # React 19 peer 충돌 시: npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm test           # vitest (28 tests)
npm run build      # tsc -b && vite build → dist/
```

> 환경 메모: Node 22(권장 24, 경고만). `@sentry/cli` postinstall이 Windows에서 실패하면
> `npm install --ignore-scripts`.

## 배포 (사용자 실행)

`granite.config.ts` 의 다음 값은 앱인토스 개발자센터 등록 후 확정:

- `appName` — 콘솔 App ID
- `brand.icon` — 콘솔 업로드 아이콘 URL (현재 플레이스홀더)

로컬 샌드박스 → 실기기 딥링크(`intoss://…`) → 콘솔 등록 → 빌드 업로드 순으로 진행합니다.
실기기·콘솔 등록·배포는 사용자가 직접 실행합니다.

— For entertainment 🌙
