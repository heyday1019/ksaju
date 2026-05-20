# Cosmic Korean Font System Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cosmic Korean 디자인 시스템의 끊어진 폰트 변수 연결을 복구하고 Pretendard Variable을 jsDelivr CDN으로 로드해서 한글·한자 본문이 의도된 폰트로 렌더링되도록 한다.

**Architecture:** `src/app/globals.css` 단일 파일을 수정한다. `layout.tsx`가 노출하는 next/font CSS 변수(`--font-geist`, `--font-inter`)를 `@theme inline` 블록에서 `var(...)` 함수로 참조하도록 바꿔서 Tailwind `font-sans` / `font-display` 유틸리티가 실제 로드된 폰트를 사용하게 한다. Pretendard는 `@import url(...)` 형태로 파일 최상단에 추가한다 (CSS 사양상 모든 `@import`는 다른 규칙 이전에 와야 함). `layout.tsx`와 `page.tsx`는 손대지 않는다.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, next/font/google, Pretendard Variable v1.3.9 (jsDelivr CDN)

**TDD:** 미적용 — 시각적 변경이라 자동 테스트 가치가 낮음. 검증은 `npm run dev` 후 브라우저 DevTools 수동 점검으로 한다.

**관련 명세서:** `docs/superpowers/specs/2026-05-20-cosmic-korean-font-system-design.md`

---

## File Structure

| 파일 | 변경 종류 | 책임 |
|------|----------|------|
| `src/app/globals.css` | Modify | Cosmic Korean 디자인 시스템의 단일 진실 공급원. 폰트 역할 매핑(Tailwind theme), 의미 토큰(CSS 변수), 유틸리티 클래스 정의. |
| `src/app/layout.tsx` | **변경 없음** | next/font 변수 노출 레이어. 이미 올바름. |
| `src/app/page.tsx` | **변경 없음** | 데모 페이지. 이번 작업 범위 밖. |

---

## Task 1: Pretendard Variable CDN 로드 추가

`@import "tailwindcss";` 이전 줄에 jsDelivr의 Pretendard Variable dynamic-subset CSS 링크를 추가한다. dynamic-subset은 한글 11,172자를 unicode-range로 분할 다운로드하므로 페이지에 실제 사용된 글자가 속한 청크만 받는다.

**Files:**
- Modify: `src/app/globals.css:1-5` (파일 최상단의 `@import` 영역)

- [ ] **Step 1: 현재 `globals.css` 최상단 5줄 확인**

Run: `Get-Content src\app\globals.css -TotalCount 6`
Expected output:
```
/* ============================================
   COSMIC KOREAN — KSaju Design System v1
   ============================================ */

@import "tailwindcss";
```

- [ ] **Step 2: `@import "tailwindcss";` 위에 Pretendard CDN @import 추가**

`src/app/globals.css` 파일에서:

변경 전:
```css
/* ============================================
   COSMIC KOREAN — KSaju Design System v1
   ============================================ */

@import "tailwindcss";
```

변경 후:
```css
/* ============================================
   COSMIC KOREAN — KSaju Design System v1
   ============================================ */

@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
@import "tailwindcss";
```

**왜 이 위치인가:** CSS 사양에 따라 `@import`는 다른 모든 규칙(`@theme`, 일반 selector 등) 이전에 와야 한다. `@import "tailwindcss";`도 `@import`이므로 동급이지만, Pretendard를 먼저 로드해야 Tailwind가 컴파일될 때 `font-hangul` 유틸리티가 실제 가능한 family 이름을 안다. 순서 자체는 둘 중 어느 게 먼저든 작동하지만, 외부 의존성을 명시적으로 먼저 표기하는 컨벤션을 따른다.

- [ ] **Step 3: jsDelivr CDN URL이 200을 반환하는지 검증**

Run:
```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" -Method Head | Select-Object StatusCode, @{n='ContentType';e={$_.Headers['Content-Type']}}
```
Expected: `StatusCode: 200`, `ContentType: text/css` (또는 비슷한 값).

CDN이 200을 반환하지 않으면 URL 오타이거나 버전 태그가 변경된 것이다. 그 경우 https://github.com/orioncactus/pretendard/releases 에서 최신 안정 태그를 확인하고 URL을 갱신한다.

- [ ] **Step 4: CSS 파일의 `font-family` 선언 확인**

Run:
```powershell
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" | Select-Object -ExpandProperty Content | Select-String -Pattern 'font-family:[^;]+' -AllMatches | ForEach-Object { $_.Matches } | Select-Object -First 3 -ExpandProperty Value
```
Expected: 결과에 `font-family:"Pretendard Variable"` (또는 따옴표 없이 `Pretendard Variable`)이 포함되어야 한다.

이게 보이면 명세서 Section 5의 "family 이름 미스매치" 위험이 해소된다. 다른 family명이 나오면 globals.css의 `--font-hangul` 1순위 값을 그에 맞게 조정해야 한다 (현재 명세는 `"Pretendard Variable"` 가정).

- [ ] **Step 5: 빌드가 깨지지 않는지 확인 (`@import` 순서 검증)**

Run: `npm run build`
Expected: 빌드 성공. CSS 컴파일러가 `@import`를 거부하면 "Misplaced @import" 또는 비슷한 오류가 나온다. 그런 경우 Pretendard `@import`가 `@import "tailwindcss";`보다 앞에 있는지 다시 확인한다.

- [ ] **Step 6: Commit**

```powershell
git add src/app/globals.css
git commit -m "fix: load Pretendard Variable via jsDelivr CDN

한글·한자 본문 렌더링을 위해 Pretendard Variable dynamic-subset을
jsDelivr CDN에서 로드. @theme inline에서 --font-hangul이 이미
'Pretendard'를 참조하고 있지만 폰트 자체가 로드되지 않아
Noto Sans KR로 fallback되던 결함을 수정한다."
```

---

## Task 2: next/font 변수와 `@theme inline` 연결 복구

`@theme inline` 블록의 폰트 family에서 문자열 리터럴 `"Geist"`, `"Inter"`를 next/font가 만든 CSS 변수 참조(`var(--font-geist)`, `var(--font-inter)`)로 교체한다. 추가로 `--font-hangul`의 1순위에 `"Pretendard Variable"`(jsDelivr CDN이 선언하는 family 정식 이름)을 넣어서 Task 1이 로드한 폰트가 실제 적용되도록 한다.

**Files:**
- Modify: `src/app/globals.css:53-64` (`@theme inline` 블록 내 폰트 정의)

- [ ] **Step 1: 현재 `@theme inline` 블록 확인**

Run: `Get-Content src\app\globals.css | Select-Object -Skip 52 -First 12`
Expected output:
```
@theme inline {
  --font-display: "Geist", system-ui, -apple-system, sans-serif;
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-hangul: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;

  --color-brand-navy: var(--color-cosmic-navy);
  --color-brand-pink: var(--color-saju-pink);
  --color-brand-gold: var(--color-korean-gold);
  --color-brand-cream: var(--color-hanji-cream);
}
```

(Note: `Skip` 인덱스가 빌드 시점 줄 번호와 다를 수 있다. 실제 줄을 보고 `@theme inline {`로 시작하는 블록을 찾아라.)

- [ ] **Step 2: 폰트 변수 3줄 교체**

`src/app/globals.css`의 `@theme inline {` 블록 안에서:

변경 전:
```css
  --font-display: "Geist", system-ui, -apple-system, sans-serif;
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-hangul: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
```

변경 후:
```css
  --font-display: var(--font-geist), system-ui, -apple-system, sans-serif;
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-hangul: "Pretendard Variable", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
```

요약:
- `--font-display`: `"Geist"` → `var(--font-geist)`
- `--font-sans`: `"Inter"` → `var(--font-inter)`
- `--font-hangul`: 1순위에 `"Pretendard Variable"` 삽입 (기존 `"Pretendard"`는 fallback으로 유지)
- `--font-serif`, `--font-mono`: 변경 없음

**중요:** `var(--font-geist)`의 `--font-geist`라는 변수 이름은 `src/app/layout.tsx:5`의 `const geist = Geist({ variable: "--font-geist", ... });` 호출에서 지정한 이름이다. 만약 layout.tsx의 `variable` 옵션이 다른 이름으로 바뀌면 이 참조도 같이 바꿔야 한다.

- [ ] **Step 3: 빌드 성공 확인**

Run: `npm run build`
Expected: 빌드 성공. Tailwind v4의 `@theme inline`은 `var(...)` 참조를 그대로 지원한다.

- [ ] **Step 4: Commit**

```powershell
git add src/app/globals.css
git commit -m "fix: bridge next/font CSS variables to Tailwind theme

@theme inline의 --font-display, --font-sans가 문자열 리터럴
'Geist'/'Inter'를 참조하고 있어 next/font가 로드한 실제 폰트가
적용되지 않고 system-ui로 fallback되던 결함을 수정. layout.tsx가
노출하는 --font-geist, --font-inter를 var(...)로 참조하도록 변경.
--font-hangul의 1순위로 'Pretendard Variable'(jsDelivr 정식
family명) 추가."
```

---

## Task 3: 수동 검증 (`npm run dev`)

명세서 Section 4의 검증 절차를 실행한다. 코드 수정 없음. DevTools 인라인 편집만 사용.

**Files:** 없음

- [ ] **Step 1: Dev 서버 시작**

Run: `npm run dev`
Expected: `Ready in ...ms`, `Local: http://localhost:3000` 로그 출력.

- [ ] **Step 2: 브라우저로 http://localhost:3000 열기**

페이지가 정상 렌더링되는지 확인. 헤더 "KSaju", "사 주" 한자, "Saju, but make it K." 카피, "Discover your saju" 핑크 CTA 버튼, "Learn more" outline 버튼이 보여야 한다. 색상은 변경하지 않았으므로 코스믹 네이비 배경 + 핑크 + 골드가 그대로 보여야 한다.

- [ ] **Step 3: Inter 폰트 적용 확인 (본문 텍스트)**

브라우저 DevTools → Elements 탭 → `<p class="text-muted-foreground">Korean fortune for the K-content generation. Built on KASI manseryeok.</p>` 노드 선택 → Computed 패널의 `font-family` 값 확인.

Expected: `__Inter_<hash>, __Inter_Fallback_<hash>, system-ui, ...` 형태. next/font가 자동 생성한 `__Inter_<hash>` 또는 `Inter` 토큰이 보이면 성공.

만약 `system-ui`나 OS 기본 폰트만 보이면 Task 2의 변수 교체가 적용 안 된 것이다. 브라우저 강력 새로고침(Ctrl+Shift+R)으로 캐시 무시 후 재확인.

- [ ] **Step 4: Pretendard CDN 다운로드 확인 (Network 탭)**

DevTools → Network 탭 → 필터 "pretendard" 입력 → 페이지 새로고침.

Expected:
- `pretendardvariable-dynamic-subset.min.css` 요청 → Status 200, Type `stylesheet`
- 페이지가 한글을 포함하는 경우 `pretendardvariable-*.woff2` 청크 1~3개 → Status 200, Type `font`

현재 `page.tsx`는 한자 "사 주"만 있고 한글 본문은 없다. 한자(CJK Unified Ideographs)에 해당하는 청크가 다운로드되거나, 아예 다운로드가 없을 수 있다. CSS 파일 자체의 200 응답만 확인되면 Task 1은 성공.

- [ ] **Step 5: Pretendard family 적용 확인 (DevTools 인라인 편집)**

DevTools → Elements 탭 → `<p class="hanja">사 주</p>` 노드를 찾는다. Elements 패널에서 해당 노드를 더블클릭해서 HTML 편집 모드로 진입한 뒤, `class="hanja"`를 `class="font-hangul"`로 임시 변경하고 Enter. (코드 파일은 수정하지 않음 — 페이지 새로고침하면 원상 복구됨.)

Computed 패널에서 `font-family` 확인.
Expected: `"Pretendard Variable", "Pretendard", "Noto Sans KR", system-ui, sans-serif` — 첫 번째 값이 `Pretendard Variable`이어야 한다. 시각적으로도 한자 폰트가 Georgia에서 Pretendard로 바뀐 게 보여야 한다.

- [ ] **Step 6: Hot reload 확인**

`src/app/globals.css`를 편집기에서 열고 `--primary: #FF4D8D;` 값을 일시적으로 `--primary: #00FF00;`(녹색)로 바꾼 후 저장 → 브라우저의 "Discover your saju" 버튼이 즉시 녹색으로 변하는지 확인.

값을 원래대로 (`#FF4D8D`) 복원하고 저장.

Expected: 두 번 모두 페이지 새로고침 없이 색상이 자동 갱신된다.

- [ ] **Step 7: 빌드 회귀 확인**

Run: `npm run build`
Expected: 빌드 성공. 빌드 산출물에 오류 없음.

- [ ] **Step 8: 검증 완료 — 별도 커밋 없음**

Task 3은 검증만 수행. DevTools 인라인 편집은 페이지 새로고침으로 사라지고, `--primary` 일시 변경은 원상 복구했으므로 커밋할 변경이 없다.

`git status`로 워킹 트리가 깨끗한지 확인:
Run: `git status`
Expected: `nothing to commit, working tree clean`.

---

## 완료 기준

- [ ] `src/app/globals.css`에 Pretendard Variable jsDelivr CDN `@import`가 `@import "tailwindcss";` 이전에 추가되어 있다.
- [ ] `@theme inline` 블록의 `--font-display`, `--font-sans`가 next/font 변수를 `var(...)` 형태로 참조한다.
- [ ] `--font-hangul`의 1순위가 `"Pretendard Variable"`이다.
- [ ] `npm run build`가 성공한다.
- [ ] `npm run dev` 후 브라우저에서 본문이 Inter 폰트로 렌더링된다 (DevTools Computed font-family에서 확인).
- [ ] `pretendardvariable-dynamic-subset.min.css` Network 요청이 200을 반환한다.
- [ ] DevTools 인라인 편집으로 `font-hangul` 클래스를 적용했을 때 텍스트가 Pretendard Variable로 렌더링된다.
- [ ] 기존 데모 페이지의 색상(코스믹 네이비/핑크/골드)이 무변경으로 유지된다.

---

## 위험 및 대응

| 상황 | 대응 |
|------|------|
| `npm run build` 실패: "Misplaced @import" | Pretendard `@import url(...)`가 `@import "tailwindcss";` 이전에 있는지 확인. CSS는 `@import`가 모든 다른 규칙보다 앞서야 함. |
| Pretendard CDN URL이 404 | https://github.com/orioncactus/pretendard/releases 에서 최신 안정 태그 확인. URL의 `@v1.3.9` 부분을 새 태그로 교체. |
| DevTools에서 font-family가 여전히 `system-ui` | (a) 강력 새로고침 (Ctrl+Shift+R), (b) `layout.tsx`의 `variable: "--font-geist"` / `variable: "--font-inter"`가 그대로인지 확인, (c) `globals.css`의 `var(--font-geist)` / `var(--font-inter)` 철자 확인. |
| Pretendard family명이 `Pretendard Variable`이 아닌 경우 (jsDelivr 버전 차이) | Task 1 Step 4에서 확인한 실제 family명을 `--font-hangul` 1순위 값으로 갱신. |
