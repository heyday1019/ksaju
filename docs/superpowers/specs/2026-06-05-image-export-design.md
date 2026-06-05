# 이미지 export 공통 기반 — 궁합 결과 9:16 공유 카드 (사이클 13) 설계 문서

> 작성일: 2026-06-05 · 상태: 승인됨 (브레인스토밍 통과)
> 로드맵: CLAUDE.md step 13. 선행: 사이클 12(인연 페이지 — 범용 `CompatibilityModal` 존재).

## 한 줄 요약

운세·궁합 결과를 SNS 공유용 **9:16 PNG**로 내보내는 **재사용 가능한 export 엔진**을 만들고, 이번 사이클엔 **궁합 결과**에만 연결한다. 클라이언트에서 `html-to-image`로 전용 9:16 `CompatShareCard`를 캡처하고, **Web Share API(파일) → 다운로드 폴백**으로 전달. 모달 본문 자체가 이 카드(축소 미리보기)가 되어 "보이는 것 = 공유되는 것".

## 원칙
- **공통 엔진 분리**: 캡처·폰트 임베딩·전달(공유/다운로드)은 카드와 독립된 재사용 레이어. 운세는 다음 사이클에 자기 카드만 공급해 재사용.
- **전용 9:16 레이아웃**(화면 UI 캡처 X). 버튼 등 인터랙티브 chrome 없는 의도된 공유 자산.
- **클라이언트 생성**(static export 유지 — 서버 라우트/헤드리스 브라우저 없음).
- 깊은 리딩 금지·"For entertainment 🌙" 디스클레이머 원칙 유지.

## 범위

### 포함
1. `src/lib/share-image.ts` (신규, client-safe) — 순수·테스트 가능 헬퍼.
2. `src/hooks/use-share-image.ts` (신규) — React 래퍼 훅(비동기 상태 소유).
3. `src/components/compat/compat-share-card.tsx` (신규) — 전용 9:16 프레젠테이션 카드(`forwardRef`).
4. `src/components/compat/compatibility-modal.tsx` 개편 — 본문을 축소된 `CompatShareCard`로 교체 + Share 버튼.
5. `html-to-image` 의존성 추가.
6. 테스트(아래).

### 비포함
- 운세(FortuneSection) 공유 — 이번 사이클 미연결. **Share ✨ (soon) 비활성 티저 유지**. 다음 사이클에 엔진 재사용.
- QR 코드(YAGNI v1).
- 서버 렌더링 PNG / OG 이미지 라우트.
- 궁합 외 다른 공유 대상.

## 컴포넌트 & 경계

### 1. 엔진 — `src/lib/share-image.ts`
프레임워크 비의존·테스트 가능 헬퍼:
- `nodeToPngBlob(node, opts)` — `await document.fonts.ready` 후 `html-to-image`의 `toBlob` 호출(`pixelRatio` 등 opts). `Blob` 반환.
- `canShareFiles(file)` — `navigator.canShare?.({ files: [file] })` 피처 디텍션.
- `shareOrDownloadPng(blob, fileName, shareMeta)` — `canShareFiles` 시 `navigator.share({ files, title, text })`; 미지원이면 `<a download>` 폴백. **네이티브 시트 사용자 취소(AbortError)는 에러가 아닌 정상 종료로 처리.**

### 2. React 래퍼 — `src/hooks/use-share-image.ts`
`useShareImage(ref, { fileName, shareMeta })` → `{ share, status }`.
- `status ∈ "idle" | "rendering" | "error"` (성공/취소는 idle 복귀).
- `share()` = ref 노드 캡처 → `shareOrDownloadPng`. 비동기 상태 소유 → 어떤 카드든 일관된 버튼 UX. **운세가 재사용하는 seam.**

### 3. 프레젠테이션 카드 — `src/components/compat/compat-share-card.tsx`
`forwardRef` div, 고정 **360×640 (9:16)** 베이스 사이즈. 캡처는 `pixelRatio: 3` → **1080×1920 PNG**.
- 렌더: changsal 밴드(상/하), `You × {name}`, 점수 `/100`, label, 양쪽 미니 사주(hanja), 짧은 breakdown, `ksaju.me` 워드마크, `For entertainment 🌙`.
- props: 모달이 이미 받는 `mePillars / other / result` 그대로 — **신규 데이터 없음**.

### 4. 모달 개편 — `compatibility-modal.tsx`
본문이 `CompatShareCard`로 교체되어 dialog에 맞게 `transform: scale()` 래퍼로 시각 축소(미리보기 = export). 아래에 **Share ✨** 버튼(`useShareImage` 연결) + **Close**.
- Dialog a11y(sr-only title/description) 보존.
- 버튼 라벨이 status 추종: `Share ✨` → `Creating…`(disabled) → idle 복귀. 에러 시 인라인 `Couldn't create image — try again`.

## 데이터/상태 흐름

```
CompatibilitySection(변경 없음)
  → CompatibilityModal 열기 (기존 props: mePillars, other, result)
    → 본문: <CompatShareCard ref={cardRef} {...props} />  (scale 축소 미리보기)
    → useShareImage(cardRef, { fileName, shareMeta })
       Share 클릭:
         status=rendering
         nodeToPngBlob(cardRef.current, { pixelRatio: 3 })
           → await document.fonts.ready → html-to-image.toBlob
         shareOrDownloadPng(blob, "ksaju-compat.png", { title, text })
           canShareFiles? navigator.share({files})  : <a download>
         성공/취소 → status=idle / 실패 → status=error
```

## 폰트 임베딩
`next/font`가 한글 명조·한자 face를 **same-origin self-host** → `html-to-image`가 임베딩 가능. 캡처 전 `await document.fonts.ready`로 빈 글리프 방지. (별도 CORS·외부 CDN 폰트 로딩 불필요.)

## 에러 처리
- 캡처 실패(`toBlob` reject/null) → `status=error`, 인라인 메시지, 재시도 가능.
- Web Share 미지원/`canShare` false → 다운로드 폴백(에러 아님).
- `navigator.share` AbortError(사용자 취소) → idle 복귀(에러 아님).

## 테스트 (vitest + happy-dom, 기존 셋업 일치)
- `share-image.test.ts`:
  - `canShareFiles` — `navigator.canShare` 존재/true/false/undefined 분기.
  - `shareOrDownloadPng` — 지원 시 `navigator.share` 호출; 미지원 시 anchor 다운로드 폴백(navigator·anchor click mock); AbortError ≠ error.
  - `nodeToPngBlob` — `document.fonts.ready` await 후 mock된 `html-to-image.toBlob`를 올바른 opts로 호출.
- `compat-share-card.test.tsx`:
  - score, label, 양쪽 name, 워드마크 렌더 확인.
- (선택) 모달 Share 버튼이 lib mock 상태에서 `rendering` 상태로 전이하는 smoke 테스트.

## 의존성
- `html-to-image` 추가(client-only, 소형). 서버 라우트·헤드리스 브라우저 없음 → static export 유지.

## 비목표 / 스코프 가드
- 운세 공유는 비활성 티저 유지(다음 사이클).
- QR·서버 OG 이미지·궁합 외 대상 제외.
- 브랜딩 = 워드마크 + entertainment 디스클레이머(현행 유지).

## 향후(이 spec 이후)
- 운세 `FortuneShareCard` + 엔진 재사용(다음 사이클).
- CLAUDE.md step 9: Vercel 배포 + ksaju.me 연결.
