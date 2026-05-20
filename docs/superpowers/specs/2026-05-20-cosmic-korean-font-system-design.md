# Cosmic Korean — 폰트 시스템 연결 수정 설계서

- **작성일:** 2026-05-20
- **상태:** 설계 승인 대기
- **범위:** 폰트 시스템 한정 (색상·레이아웃·컴포넌트 변경 없음)
- **TDD:** 미적용 (시각적 변경, 자동 테스트 가치 낮음)

---

## 1. 컨텍스트

`Phase 1` 커밋(`e1dc2ed`)에서 Cosmic Korean 디자인 시스템의 골격이 이미 적용되었다. 4색 팔레트와 다크 모드 강제, shadcn Maia 컴포넌트, 데모 페이지까지 완성. 그러나 **타이포그래피 시스템의 연결이 끊어진 상태**다.

### 1.1 발견된 결함

**결함 1 — next/font ↔ `@theme inline` 변수 연결 누락**

`src/app/layout.tsx`는 next/font로 Geist와 Inter를 로드하고 각각 CSS 변수 `--font-geist`, `--font-inter`로 노출한다. 그러나 `src/app/globals.css`의 `@theme inline` 블록은 이 변수들을 참조하지 않고 문자열 리터럴 `"Geist"`, `"Inter"`를 직접 적는다:

```css
/* 현재 — 잘못된 상태 */
--font-display: "Geist", system-ui, -apple-system, sans-serif;
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
```

브라우저는 `"Geist"`라는 이름의 폰트를 시스템에서 찾지 못하면 system-ui로 fallback한다. next/font가 실제로 로드한 폰트 파일은 사용되지 않는다. 결과적으로 모든 Tailwind `font-sans` / `font-display` 유틸리티가 시스템 폰트로 렌더링된다.

**결함 2 — Pretendard 미로드**

`--font-hangul: "Pretendard", "Noto Sans KR", system-ui, sans-serif`로 선언되어 있지만 Pretendard는 어디서도 로드되지 않는다. 모든 한글·한자 텍스트가 Noto Sans KR(또는 system-ui)로 떨어진다. `.hanja` 유틸리티는 Georgia(serif)를 쓰므로 한자 렌더링은 어떻게든 되지만, 한글 본문의 의도된 폰트가 적용되지 않는다.

---

## 2. 목표

1. next/font가 로드한 **Geist**와 **Inter**가 실제로 Tailwind `font-display` / `font-sans` 유틸리티에 적용되도록 변수 연결을 복구한다.
2. **Pretendard Variable**을 jsDelivr CDN에서 dynamic-subset 방식으로 로드하여 한글·한자 본문 렌더링에 적용한다.
3. 변경 범위를 `src/app/globals.css` **단일 파일**에 한정한다 (`layout.tsx`·`page.tsx`는 손대지 않는다).

### 2.1 비목표 (Out of Scope)

- 색상 토큰 변경
- 컴포넌트 변경
- `page.tsx` 데모 콘텐츠 변경
- 다국어 번역, 폰트 가변 축(weight axis) 활용
- Pretendard 자가 호스팅 — 일단 CDN, 성능 필요시 차후 마이그레이션

---

## 3. 설계

### 3.1 변경 대상 파일

`src/app/globals.css` 한 파일.

### 3.2 변경 내용

**변경 1 — Pretendard CDN @import 추가 (파일 최상단)**

`@import "tailwindcss";` **이전**에 추가한다. CSS 사양상 `@import`는 다른 모든 규칙보다 앞서야 하며, 그렇지 않으면 브라우저가 무시한다.

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
@import "tailwindcss";
```

`pretendardvariable-dynamic-subset`을 선택하는 이유:
- **Variable** — weight 100~900 단일 파일, 향후 가변 축 활용 가능
- **dynamic-subset** — 한글 11,172자를 unicode-range로 분할하여 페이지에서 실제 사용한 글자가 속한 청크만 다운로드. 한국어 본문 페이지의 초기 폰트 페이로드를 크게 줄인다.

**변경 2 — `@theme inline` 내 폰트 변수를 next/font CSS 변수 참조로 교체**

```css
/* 변경 전 */
@theme inline {
  --font-display: "Geist", system-ui, -apple-system, sans-serif;
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-hangul: "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
  ...
}

/* 변경 후 */
@theme inline {
  --font-display: var(--font-geist), system-ui, -apple-system, sans-serif;
  --font-sans: var(--font-inter), system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, "Iowan Old Style", "Times New Roman", serif;
  --font-hangul: "Pretendard Variable", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-mono: ui-monospace, "Cascadia Code", "SF Mono", Menlo, monospace;
  ...
}
```

세 가지 미세 변경:
- `--font-display`: `"Geist"` 문자열 → `var(--font-geist)` next/font 변수 참조
- `--font-sans`: `"Inter"` 문자열 → `var(--font-inter)` next/font 변수 참조
- `--font-hangul`: `"Pretendard Variable"`을 1순위로 추가 (Pretendard variable font의 정식 family 이름)

`--font-serif`와 `--font-mono`는 변경 없음.

### 3.3 단일 진실 공급원 원칙

이 설계의 핵심은 **`globals.css`가 디자인 시스템 어휘의 단일 진실 공급원**이라는 점이다.

- `layout.tsx`는 next/font가 만드는 변수 이름(`--font-geist`, `--font-inter`)을 그대로 노출한다. **폰트 정체성** 레이어.
- `globals.css`는 그 변수들을 Tailwind 의미적 역할(`--font-display`, `--font-sans`)로 매핑한다. **역할 의미** 레이어.
- 컴포넌트는 `font-display`, `font-sans`, `font-hangul` 유틸리티만 안다. **사용** 레이어.

향후 Geist를 Manrope로 교체할 때 `layout.tsx`에서 import만 바꾸면 되고, "display 역할은 Manrope가 맡는다"는 의도 표현을 위해 `globals.css`만 손대면 된다.

---

## 4. 검증

### 4.1 기능 검증 (수동)

`npm run dev` 후 `localhost:3000`에서 브라우저 DevTools로 확인:

1. **Inter 적용 확인 (본문):**
   - `<p class="text-muted-foreground">` 노드 선택 → Computed `font-family`가 `"Inter Fallback"` 또는 `Inter`로 시작.
   - 변경 전에는 `system-ui` 또는 OS 기본 폰트로 표시됨.

2. **Geist 적용 확인 (헤딩):**
   - `<h1>` "KSaju" 노드 선택 → 현재 `page.tsx`는 `font-sans` 기본을 쓰므로 Inter가 적용된다. 만약 향후 `font-display` 클래스를 붙이면 Geist로 전환.
   - 일단 이번 변경은 "변수 연결이 끊겨있던 게 복구됨"의 검증이므로, Inter가 본문에 적용된 것만으로 충분.

3. **Pretendard 로드 확인 (Network):**
   - 페이지 로드 시 Network 탭에서 `pretendardvariable-*.woff2` 청크 다운로드 발생. `text/css` 첫 요청이 jsDelivr 도메인에서 200 응답.
   - 현재 `page.tsx`에는 `font-hangul` 클래스를 쓰는 요소가 없으므로 dynamic-subset 사양상 woff2 청크 다운로드가 안 일어날 수도 있다. 이 경우 **브라우저 DevTools에서 인라인으로 일시 편집**하여 검증: `<p class="hanja">사 주</p>`의 클래스를 임시로 `font-hangul`로 바꾸고 폰트가 Pretendard Variable로 전환되는지 확인. 코드 수정 없음.

4. **Hot reload 확인:**
   - `globals.css`의 `--primary` 값을 일시 변경 → 브라우저가 자동 갱신되는지.

### 4.2 회귀 확인

- `npm run build`가 성공해야 한다 (CSS @import 순서 오류 없음).
- 기존 데모 페이지의 핑크 CTA, 골드 그라데이션, 코스믹 배경이 모두 그대로 보여야 한다 — 색상은 손대지 않으므로 무변경이 정상.

### 4.3 검증 후 정리

- 검증은 DevTools 인라인 편집으로만 수행하므로 코드 정리 작업 없음.

---

## 5. 위험 및 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| jsDelivr CDN 다운/지연 | Pretendard fallback → Noto Sans KR → system-ui 순으로 떨어짐. 한글 가독성 저하. | fallback 체인이 명세대로 동작. 출시 전 자가 호스팅 마이그레이션 검토. |
| dynamic-subset가 `unicode-range`로 다수 요청 발생 | HTTP/2 multiplexing으로 큰 영향 없음. 페이지에 실제 사용된 글자만 다운로드되므로 총량은 오히려 작음. | 변경 없음. |
| `"Pretendard Variable"` family 이름 미스매치 | 폰트가 적용 안 됨 | jsDelivr CSS 파일을 직접 열어 `font-family: "Pretendard Variable"` 선언 확인. v1.3.9 기준 family명 확정. |
| next/font 변수명 변경 가능성 | `var(--font-geist)` 참조 깨짐 | `layout.tsx`의 `variable` 옵션은 명시적으로 지정되어 있어 next.js 버전 업과 무관. 안정적. |

---

## 6. 마이그레이션·롤백

- **롤백:** `globals.css`를 이전 커밋으로 되돌리면 끝. 다른 파일 영향 없음.
- **마이그레이션:** 없음. 신규 시스템이 아닌 결함 수정.

---

## 7. 후속 작업 (이번 명세 범위 외)

- Pretendard 자가 호스팅 전환 (`next/font/local` + woff2 다운로드)
- `page.tsx`에 명세 의도 반영 — 헤딩에 `font-display`, 한글 카피에 `font-hangul` 명시 적용
- 가변 weight 활용 (`font-weight` 100~900 자유롭게)
- 폰트 가독성 검증 — 다크 배경 + 핑크/골드 액센트 위에서 Inter·Pretendard 본문 가독성 측정
