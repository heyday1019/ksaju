# 프로덕션 런치 준비 (사이클 14) 설계 문서

> 작성일: 2026-06-05 · 상태: 승인됨 (브레인스토밍 통과)
> 로드맵: CLAUDE.md step 9(Vercel 배포 + ksaju.me)의 **선행 dev 작업**. 배포 실행(Vercel/DNS)은 사용자 런북으로 후속.

## 한 줄 요약

`ksaju.me` 공개 소프트 론칭을 위한 dev 준비: **소셜 링크 프리뷰(OG/Twitter 카드 + 코드 생성 OG 이미지)**, **검색엔진 기본(robots·sitemap)**, **피벗 잔재 정리**. 실제 Vercel 프로젝트 생성·도메인 DNS는 사용자가 실행할 **런북**으로 분리(계정·레지스트라 접근 필요).

## 원칙
- 앱은 env var/Supabase 미사용 = **zero-config Next.js**. 배포는 Vercel가 자동 감지(Server Action `calcUserSaju`는 Vercel 함수로 네이티브 실행, static export 아님).
- 바이럴 wedge = IG/TikTok에서 `ksaju.me` 링크 공유 → **링크 프리뷰 카드가 중요**.
- YAGNI: 분석/추가 아이콘/CJK OG 폰트 등은 후속.

## 범위

### 포함 (이번 사이클 — dev)
1. `src/app/layout.tsx` 루트 `metadata` 확장 — `metadataBase` + `openGraph` + `twitter`.
2. `src/app/opengraph-image.tsx` (신규) — `next/og` `ImageResponse` 1200×630 브랜드 카드.
3. `src/app/robots.ts` (신규) — 전체 허용 + sitemap 참조.
4. `src/app/sitemap.ts` (신규) — `/`·`/inyeon`.
5. 정리 — 죽은 피벗 잔재 삭제: `src/app/layout_org.tsx`, `src/app/page_org.tsx`, `src/app/globals_org.css` (참조 0건 확인됨).
6. 테스트(아래) + `next build` 검증.
7. 배포 런북 문서(`docs/deploy-runbook.md`) 작성 — 사용자가 실행.

### 비포함
- Vercel 프로젝트 생성·도메인 DNS 설정(런북으로 사용자 실행).
- 웹 분석(Vercel Analytics 등), apple-touch/추가 아이콘(favicon.ico 존재).
- OG 이미지 CJK(한글/한자) 텍스트 — 폰트 임베딩 필요 → 빌드 견고성 위해 v1 Latin only.
- robots noindex 게이팅(기본 indexable).

## 컴포넌트 & 상세

### 1. 루트 metadata (`src/app/layout.tsx`)
기존 `title`/`description` 유지 + 추가:
- `metadataBase: new URL("https://ksaju.me")` — OG/상대경로 절대화 + opengraph-image 라우트 절대화.
- `openGraph`: `{ title, description, url: "https://ksaju.me", siteName: "KSaju", locale: "en_US", type: "website" }`.
- `twitter`: `{ card: "summary_large_image", title, description }`.
- OG/twitter 이미지는 `opengraph-image.tsx` 파일 컨벤션으로 Next가 자동 연결(명시 `images` 불필요).
- `/inyeon`은 자체 title/description 유지, OG shell 상속.

### 2. OG 이미지 (`src/app/opengraph-image.tsx`)
- `export const size = { width: 1200, height: 630 }`, `export const contentType = "image/png"`, `export const alt = "KSaju — Saju, but make it K."`.
- `next/og`의 `ImageResponse`로 JSX 렌더. 한지 팔레트: bg 크림 `#FBF6E8`, 묵 `#1A1A2E`, 진달래 `#C8385A`, 단청황 `#C49A3F`.
- 구성: 은은한 井(우물정) 격자 라인(div 보더) + **KSaju** 워드마크(대형) + 태그라인 "Saju, but make it K." + 하단 우측 `ksaju.me`.
- **Latin only**(시스템/기본 폰트) — CJK 미사용으로 폰트 fetch 없이 빌드 견고.

### 3. robots (`src/app/robots.ts`)
```
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://ksaju.me/sitemap.xml",
  };
}
```

### 4. sitemap (`src/app/sitemap.ts`)
```
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ksaju.me";
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified },
    { url: `${base}/inyeon`, lastModified },
  ];
}
```

### 5. 정리
`layout_org.tsx`·`page_org.tsx`·`globals_org.css` 삭제(grep 참조 0건). 동작 무영향.

### 6. 배포 런북 (`docs/deploy-runbook.md`)
사용자 실행 단계:
1. `git push origin main`.
2. vercel.com → New Project → `heyday1019/ksaju` import. Framework=Next.js 자동, env var 없음, 기본 빌드.
3. 첫 배포 후 `*.vercel.app`에서 동작 확인(`/`, `/inyeon`, 궁합 모달 Share, OG 프리뷰).
4. Project → Domains → `ksaju.me`(+`www`) 추가 → 레지스트라에 Vercel 안내 DNS(A/CNAME) 설정.
5. SSL 발급·전파 확인 → OG 디버거(예: opengraph.xyz)로 `ksaju.me` 카드 확인.

## 테스트 (vitest, 기존 셋업)
- `src/app/sitemap.test.ts` — sitemap()이 `/`·`/inyeon` 두 url(ksaju.me 베이스) 반환, length 2.
- `src/app/robots.test.ts` — robots()가 `userAgent:"*"`, `allow:"/"`, `sitemap: https://ksaju.me/sitemap.xml` 반환.
- metadata·OG 이미지: `npm run build` 성공(opengraph-image 라우트 무에러 생성) + 전체 스위트 그린으로 검증.

## 검증
- `npm test`(신규 robots/sitemap 테스트 포함) 그린.
- `npx tsc --noEmit` clean.
- `npm run lint` 신규 경고 0(기존 2건 허용).
- `npm run build` 성공 — `/`·`/inyeon` + `/opengraph-image`·`/robots.txt`·`/sitemap.xml` 라우트 생성.

## 비목표 가드
- 코드에서 Vercel/DNS 자동화 시도 금지(런북으로 위임).
- OG에 CJK·외부 폰트 fetch 금지(v1).
