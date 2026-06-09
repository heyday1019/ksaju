# 공유 카드 유입 마그넷 (브랜디드 QR 푸터) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 두 공유 카드(궁합·운세) 하단을 낙관-중앙 브랜디드 QR + "Make yours →" CTA 공통 푸터로 교체해, 공유된 카드가 `ksaju.me` 유입 마그넷이 되게 한다.

**Architecture:** `ksaju.me`는 고정 URL이라 빌드와 무관한 1회 생성 스크립트(`scripts/gen-qr.mjs`)로 낙관을 중앙에 합성한 QR을 `public/ksaju-qr.png`로 굽고 커밋한다(런타임 의존성 0). 신규 `ShareCardFooter` 프레젠테이션 컴포넌트가 그 PNG + CTA를 렌더하고, `CompatShareCard`·`FortuneShareCard`의 기존 푸터 블록을 대체한다(DRY).

**Tech Stack:** Node 스크립트(`qrcode` + `sharp`, devDependency), Next.js 16 클라이언트 컴포넌트, 정적 `<img>`, vitest + happy-dom + RTL, `html-to-image` 캡처(기존).

**Spec:** `docs/superpowers/specs/2026-06-09-share-magnet-qr-design.md`

---

## File Structure

- `scripts/assets/stamp-saju.png` (create) — 사용자가 만든 낙관 소스(루트 `stamp-watermark2.png`에서 편입).
- `scripts/gen-qr.mjs` (create) — QR 생성 + 낙관 합성 → `public/ksaju-qr.png`. 1회성·재실행 가능.
- `public/ksaju-qr.png` (create, 산출물 커밋) — 브랜디드 QR 정적 에셋.
- `package.json` (modify) — `gen:qr` 스크립트 + devDeps `qrcode`/`sharp`.
- `src/components/share/share-card-footer.tsx` (create) — 공통 마그넷 푸터(QR + CTA).
- `src/components/share/share-card-footer.test.tsx` (create) — QR alt/src + CTA + 디스클레이머.
- `src/components/compat/compat-share-card.tsx` (modify) — 푸터 블록 → `<ShareCardFooter />`.
- `src/components/fortune/fortune-share-card.tsx` (modify) — 푸터 블록 → `<ShareCardFooter />`.
- `src/components/compat/compatibility-modal.tsx` (modify) — 공유 텍스트 훅.
- `src/components/fortune/fortune-share-modal.tsx` (modify) — 공유 텍스트 훅.
- `CLAUDE.md` / `task-log.md` (modify) — 완료 기록.

**Reused (read first):** `scripts/seed-idols.mjs`(1회 생성기 패턴), `src/components/compat/compat-share-card.tsx`·`src/components/fortune/fortune-share-card.tsx`(교체 대상 푸터 블록 `<div className="w-full pb-9">…</div>`), `src/lib/share-image.ts`(`nodeToPngBlob`은 폰트만 대기; same-origin 이미지는 캡처 시 인라인됨).

---

## Task 1: 브랜디드 QR 에셋 생성

**Files:**
- Create: `scripts/assets/stamp-saju.png`, `scripts/gen-qr.mjs`, `public/ksaju-qr.png`
- Modify: `package.json`

- [ ] **Step 1: 낙관 소스를 repo로 편입**

루트의 사용자 낙관(`stamp-watermark2.png`)을 스크립트 자산 폴더로 복사한다(소스 보존).

Run (PowerShell):
```powershell
New-Item -ItemType Directory -Force scripts/assets | Out-Null
Copy-Item stamp-watermark2.png scripts/assets/stamp-saju.png
```
Expected: `scripts/assets/stamp-saju.png` 생성.

- [ ] **Step 2: 생성 의존성 추가**

Run:
```bash
npm install -D qrcode sharp
```
Expected: `package.json` devDependencies에 `qrcode`·`sharp` 추가, 설치 성공.

- [ ] **Step 3: `package.json`에 스크립트 추가**

`scripts` 블록에 한 줄 추가(`seed:idols` 아래):
```json
    "seed:idols": "node scripts/seed-idols.mjs",
    "gen:qr": "node scripts/gen-qr.mjs"
```

- [ ] **Step 4: 생성 스크립트 작성**

Create `scripts/gen-qr.mjs`:
```js
// 브랜디드 QR 생성기 (1회성·재실행 가능). ksaju.me는 고정 URL이라
// 산출물 public/ksaju-qr.png 한 장만 커밋 → 런타임 의존성 0.
// URL이나 낙관이 바뀌면 `npm run gen:qr` 재실행 후 산출물 재커밋.
import QRCode from "qrcode";
import sharp from "sharp";
import path from "node:path";

const URL = "https://ksaju.me";
const SIZE = 900; // QR 한 변(px)
const OUT = path.resolve("public/ksaju-qr.png");
const STAMP = path.resolve("scripts/assets/stamp-saju.png");

async function main() {
  // 1) QR (에러정정 H → 중앙 로고 가림 허용). 모듈=묵, 배경=흰색.
  const qr = await QRCode.toBuffer(URL, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: SIZE,
    color: { dark: "#1A1A2E", light: "#FFFFFF" },
  });

  // 2) 낙관: 우하단 메이커 워터마크를 센터-크롭으로 떨궈낸 뒤 로고 크기로 리사이즈.
  //    (도장은 중앙 ~75%에 있고 워터마크는 코너 여백에 있으므로 84% 센터-크롭이면 제거됨.)
  const meta = await sharp(STAMP).metadata();
  const side = Math.min(meta.width, meta.height);
  const crop = Math.round(side * 0.84);
  const logo = Math.round(SIZE * 0.2); // ~180px (~20% — 레벨 H 허용 범위)
  const stamp = await sharp(STAMP)
    .extract({
      left: Math.round((meta.width - crop) / 2),
      top: Math.round((meta.height - crop) / 2),
      width: crop,
      height: crop,
    })
    .resize(logo, logo, { fit: "contain", background: "#FFFFFF" })
    .toBuffer();

  // 3) 로고 뒤 흰 둥근 패치(스캔 quiet-zone).
  const pad = Math.round(logo * 0.16);
  const patchSize = logo + pad * 2;
  const r = Math.round(patchSize * 0.16);
  const patchBg = Buffer.from(
    `<svg width="${patchSize}" height="${patchSize}">` +
      `<rect width="${patchSize}" height="${patchSize}" rx="${r}" ry="${r}" fill="#FFFFFF"/>` +
      `</svg>`,
  );
  const patch = await sharp(patchBg)
    .composite([{ input: stamp, gravity: "center" }])
    .png()
    .toBuffer();

  // 4) QR 중앙에 패치 합성 → 출력.
  await sharp(qr)
    .composite([{ input: patch, gravity: "center" }])
    .png()
    .toFile(OUT);

  console.log(`✓ wrote ${OUT} (${SIZE}x${SIZE}, QR -> ${URL})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 5: 생성 실행**

Run:
```bash
npm run gen:qr
```
Expected: `✓ wrote …/public/ksaju-qr.png (900x900, QR -> https://ksaju.me)`.

- [ ] **Step 6: 산출물 검증**

Run:
```bash
node -e "const s=require('fs').statSync('public/ksaju-qr.png'); if(s.size<1000) throw new Error('too small'); console.log('ok', s.size, 'bytes')"
```
Expected: `ok <size> bytes`.

육안 1회: `public/ksaju-qr.png`를 열어 (a) 워터마크가 안 보이고 (b) 폰 QR 리더로 스캔 시 문자열 `https://ksaju.me`가 디코드되는지 확인. (DNS 연결 전이라 페이지 로드는 안 돼도 URL 디코드는 돼야 정상. 만약 워터마크가 남으면 `gen-qr.mjs`의 `0.84`를 `0.8`로 낮춰 재실행. 만약 스캔이 안 되면 `logo` 비율 `0.2`를 `0.18`로 낮춰 재실행.)

- [ ] **Step 7: Commit**

```bash
git add scripts/assets/stamp-saju.png scripts/gen-qr.mjs public/ksaju-qr.png package.json package-lock.json
git commit -m "feat(share): generate branded QR asset (saju seal + ksaju.me) via gen:qr

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `ShareCardFooter` 공통 컴포넌트

**Files:**
- Create: `src/components/share/share-card-footer.tsx`, `src/components/share/share-card-footer.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

Create `src/components/share/share-card-footer.test.tsx`:
```tsx
// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareCardFooter } from "./share-card-footer";

describe("ShareCardFooter", () => {
  it("renders the branded QR, Make-yours CTA and disclaimer", () => {
    render(<ShareCardFooter />);
    const qr = screen.getByAltText(/make your own/i);
    expect(qr).toHaveAttribute("src", "/ksaju-qr.png");
    expect(screen.getByText(/Make yours/i)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/components/share/share-card-footer.test.tsx`
Expected: FAIL — 모듈 `./share-card-footer` 없음.

- [ ] **Step 3: 컴포넌트 작성**

Create `src/components/share/share-card-footer.tsx`:
```tsx
/**
 * 공유 카드 공통 푸터 = 유입 마그넷.
 * 낙관-중앙 브랜디드 QR(public/ksaju-qr.png, 자체 흰 패널 → 카드 테마 무관 스캔 대비)
 * + "Make yours → ksaju.me" CTA + "For entertainment 🌙" 디스클레이머.
 * CompatShareCard·FortuneShareCard 둘 다 사용. html-to-image가 same-origin
 * 정적 이미지를 캡처 시 인라인하므로 export 추가 코드 불필요.
 */
export function ShareCardFooter() {
  return (
    <div className="flex w-full flex-col items-center gap-2 pb-7">
      <div className="rounded-xl bg-white p-2 shadow-sm">
        {/* 정적 img(next/image 아님) — 캡처/로드 단순화 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ksaju-qr.png"
          alt="Scan to make your own at ksaju.me"
          width={92}
          height={92}
          className="block"
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold text-primary">
          Make yours → <span className="text-foreground">ksaju.me</span>
        </p>
        <p className="text-[11px] text-muted-foreground">For entertainment 🌙</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/components/share/share-card-footer.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/share/share-card-footer.tsx src/components/share/share-card-footer.test.tsx
git commit -m "feat(share): ShareCardFooter — branded QR + Make-yours CTA magnet

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 두 공유 카드에 푸터 연결

**Files:**
- Modify: `src/components/compat/compat-share-card.tsx`, `src/components/fortune/fortune-share-card.tsx`

- [ ] **Step 1: 궁합 카드 푸터 교체**

`src/components/compat/compat-share-card.tsx` 상단 import에 추가:
```tsx
import { ShareCardFooter } from "@/components/share/share-card-footer";
```
그리고 아래 블록을 찾아:
```tsx
        <div className="w-full pb-9">
          <p className="font-display text-base font-semibold text-primary">
            ksaju.me
          </p>
          <p className="text-[11px] text-muted-foreground">
            For entertainment 🌙
          </p>
        </div>
```
다음으로 교체:
```tsx
        <ShareCardFooter />
```

- [ ] **Step 2: 운세 카드 푸터 교체**

`src/components/fortune/fortune-share-card.tsx` 상단 import에 추가:
```tsx
import { ShareCardFooter } from "@/components/share/share-card-footer";
```
그리고 아래 블록을 찾아:
```tsx
        <div className="w-full pb-9">
          <p className="font-display text-base font-semibold text-primary">
            ksaju.me
          </p>
          <p className="text-[11px] text-muted-foreground">
            For entertainment 🌙
          </p>
        </div>
```
다음으로 교체:
```tsx
        <ShareCardFooter />
```

- [ ] **Step 3: 기존 카드 테스트 통과 확인**

Run: `npx vitest run src/components/compat/compat-share-card.test.tsx src/components/fortune/fortune-share-card.test.tsx`
Expected: PASS — 두 카드 모두 `ksaju.me`·`For entertainment`를 여전히 푸터(컴포넌트)에서 렌더하므로 기존 단언 그대로 통과.

- [ ] **Step 4: 레이아웃 확인 (dev) — 오버플로 점검**

Run: `npm run dev` 후 두 공유 카드 미리보기를 연다(`/`에서 운세 Share, `/inyeon`에서 궁합 Share). QR 푸터가 추가되며 카드가 640px를 넘쳐 클리핑되는지 확인.
- 궁합 카드가 빡빡하면 중앙 컨테이너의 `gap-5`를 `gap-4`로 줄인다(파일 내 `flex w-full flex-1 flex-col items-center justify-center gap-5 px-7 pt-10`).
- 운세 카드가 빡빡하면 중앙 컨테이너 `gap-4`를 `gap-3`로, 운세 li 패딩 `p-2.5`를 `p-2`로 줄인다.
라이트 + 다크(Cosmic) + 모바일 폭에서 미리보기=export 동일성 확인. 변경했다면 해당 카드 테스트 재실행해 그대로 PASS인지 확인.

- [ ] **Step 5: Commit**

```bash
git add src/components/compat/compat-share-card.tsx src/components/fortune/fortune-share-card.tsx
git commit -m "feat(share): wire ShareCardFooter into compat + fortune cards

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 공유 텍스트 훅

**Files:**
- Modify: `src/components/compat/compatibility-modal.tsx`, `src/components/fortune/fortune-share-modal.tsx`

- [ ] **Step 1: 궁합 모달 공유 텍스트**

`src/components/compat/compatibility-modal.tsx`에서 찾기:
```tsx
      text: `You × ${other.name}: ${result.score}/100 — ksaju.me`,
```
교체:
```tsx
      text: `You × ${other.name}: ${result.score}/100 — make yours at ksaju.me`,
```

- [ ] **Step 2: 운세 모달 공유 텍스트**

`src/components/fortune/fortune-share-modal.tsx`를 열어 `shareMeta`의 `text:` 줄을 찾는다. `ksaju.me`로 끝나는 한 줄짜리 텍스트를 다음 형태로 바꿔 "make yours at ksaju.me" 훅을 포함시킨다(앞부분 카피는 보존, 끝의 `ksaju.me`만 `make yours at ksaju.me`로):
```tsx
      text: `My KSaju fortune — make yours at ksaju.me`,
```
(원본 text가 이미 다른 카피면 동일하게 끝부분만 `make yours at ksaju.me`로 맞춘다.)

- [ ] **Step 3: 타입/린트 확인**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/compat/compatibility-modal.tsx src/components/fortune/fortune-share-modal.tsx
git commit -m "feat(share): add 'make yours at ksaju.me' hook to share captions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 검증 + 문서 + 브랜치 마무리

**Files:** Modify `CLAUDE.md`, `task-log.md`

- [ ] **Step 1: 전체 게이트**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all green (**166 tests** = 169 직전 사이클 − 사이클 21은 이 브랜치 기준 169에서 시작하므로 169 + 1 신규 footer 테스트 = **170 tests**), tsc clean, lint는 기존 2 경고(`form.tsx` ref, `saju-data.ts` YinYang)만. (실제 카운트는 직전 `npm test` 합계 + 1; 불일치 시 신규/변경 테스트 수로 재확인.)

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 성공; `/`·`/inyeon` 및 trust 페이지 static `○`. (Google-font 일시 오류 시 1회 재실행.)

- [ ] **Step 3: 잔재 정리(선택)**

루트의 임시 파일들이 git에 안 들어가게 정리한다. `scripts/assets/stamp-saju.png`(편입본)만 남기고, 나머지 untracked 잔재를 `.gitignore`에 추가하거나 제거:
```powershell
Remove-Item -ErrorAction SilentlyContinue bi8Au.png, public/bi8Au.png, scripts/bi8Au.png, stamp-watermark.png, stamp-watermark2.png, watermark.pen, "palnet+token.jpg"
Remove-Item -ErrorAction SilentlyContinue "C：tempidol-db-check.json","C：tempidol-seed-check.json","C：tempksaju-db-check.json","C：tempksaju-seed-check.json"
```
Run: `git status` — 잔재가 더 이상 untracked로 안 보이는지 확인. (확신 없으면 제거 대신 `.gitignore`에 추가.)

- [ ] **Step 4: 로드맵 문서 + 커밋**

`CLAUDE.md` 로드맵 항목 20/21 뒤에 사이클 22 한 줄 추가(공유 카드 브랜디드 QR 마그넷 푸터, 두 카드 공통 `ShareCardFooter`, 1회 생성 `gen:qr`, 런타임 의존성 0, QR은 ksaju.me DNS 연결 후 라이브). `task-log.md` 최상단(`## 2026-06-09` 신규 일자 섹션)에 사이클 22 완료 항목 추가. 그다음:
```bash
git add CLAUDE.md task-log.md .gitignore
git commit -m "docs: mark cycle 22 (share-card QR magnet) complete

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

- [ ] **Step 5: 브랜치 마무리**

announce 후 **superpowers:finishing-a-development-branch** 사용 — 테스트 검증 + merge/PR 옵션 제시(예상: `feat/share-magnet-qr` → `main` fast-forward merge + push, 프로젝트 워크플로 기준). ⚠️ 마무리 보고에 "QR은 ksaju.me DNS 연결 후에만 라이브"를 사용자 후속 작업으로 명시.

---

## Self-Review Notes (author)

- **Spec coverage:** §2 QR 에셋(1회 생성·낙관 합성·워터마크 크롭·정적 커밋·devDeps) → Task 1 ✓; §3 공통 `ShareCardFooter` → Task 2 ✓; §3 두 카드 연결 → Task 3 ✓; §4 공유 텍스트 훅 → Task 4 ✓; §6 테스트(footer 신규 + 기존 카드 통과) → Task 2/3 ✓; §4 레이아웃 dev 확인 → Task 3 Step 4 ✓; §7 잔재 정리 → Task 5 Step 3 ✓; §8 DNS 리스크 → Task 5 Step 5 보고 ✓. 비목표(런타임 QR·동적 URL·새 분석·본문 재설계·전역 낙관) 미터치 ✓.
- **Placeholder scan:** 없음 — 모든 코드/명령/경로 리터럴. 단 운세 모달 공유 텍스트(Task 4 Step 2)는 원본 카피가 미확인이라 "끝부분만 맞춤" 규칙 + 구체 예시 제공(파일에서 한 줄 확인 후 적용).
- **Type consistency:** `ShareCardFooter`는 props 없음 — 두 카드 모두 `<ShareCardFooter />`로 동일 호출. QR 경로 `/ksaju-qr.png`(public 루트)와 산출물 `public/ksaju-qr.png` 일치. 테스트의 `getByAltText(/make your own/i)`·`src="/ksaju-qr.png"`가 컴포넌트의 `alt`/`src`와 일치. 기존 카드 테스트의 `getByText("ksaju.me")`는 푸터 span의 정확 텍스트 노드와 일치(유일).
- **테스트 카운트:** 직전 합계는 169(사이클 21). 이 브랜치는 169에서 시작 → footer 신규 1 = **170**. Task 5 Step 1은 실제 합계로 재확인(±는 신규/변경분으로 설명).
