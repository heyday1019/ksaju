# '인연' 페이지 — 궁합 이전 + 일반 상대 궁합 (사이클 12) 설계 문서

> 작성일: 2026-06-04 · 상태: 승인됨 (브레인스토밍 통과)
> 로드맵: CLAUDE.md step 12. 선행: 사이클 11(멀티페이지 골격, `/inyeon` 플레이스홀더 존재).

## 한 줄 요약

`/inyeon` 플레이스홀더를 실제 '인연' 페이지로 채운다: (a) 기존 **K-pop 최애 궁합**을 홈(`/`)에서 `/inyeon`으로 이전, (b) **일반 상대 궁합**(상대 생일+이름 입력 → 궁합) 추가. 사용자 본인 사주는 **localStorage**로 홈↔인연 공유. `CompatibilityModal`을 아이돌 전용에서 **범용**으로 일반화해 두 경우가 재사용.

## 원칙
- 기존 궁합 엔진(`calcCompatibility`/`compatForIdol`/`normalizeIdolSaju`)·`BirthForm`·`IdolPicker` 재사용. DRY.
- 깊은 리딩 금지 원칙 유지(가벼운 fun 궁합). 이미지 export는 사이클 13.

## 범위

### 포함
1. `src/lib/saju-storage.ts` (신규, client-safe) — userSaju localStorage 영속.
2. `CompatibilityModal` 일반화 — `idol: Idol` → 범용 `other: { name; sub?; pillars }`.
3. `CompatibilitySection`(아이돌) — 일반화된 모달 props로 갱신(기능 동일), `/inyeon`에서 사용.
4. `PartnerCompatSection` (신규) — 상대 이름(optional)+생일 → `calcUserSaju` → `calcCompatibility` → 범용 모달.
5. `/inyeon/page.tsx`(server, metadata 유지) + `src/components/inyeon/inyeon-view.tsx`(신규 client) — localStorage me 로드(없으면 생일 폴백 폼) + 아이돌·상대 두 섹션(세로 스택).
6. 홈: `page.tsx` 제출 시 `saveUserSaju`, `SajuResult` 인라인 궁합 → `/inyeon` CTA 링크로 교체.
7. `BirthForm` 소폭 일반화 — optional `submitLabel`/`submittingLabel`.
8. 테스트(아래).

### 비포함
- 이미지 export/공유 PNG (사이클 13).
- 운세-인연 통합, 궁합 히스토리 저장.
- 상대 사주 localStorage 저장(상대는 1회성).

## 데이터/상태 흐름

```
홈(/) 제출:
  calcUserSaju(birth) → setUserSaju + saveUserSaju(saju)   // localStorage 기록
  SajuResult: (인라인 궁합 제거) "Check your 인연 ✨ →" CTA → <Link href="/inyeon">

/inyeon 진입 (client, mount 후):
  me = loadUserSaju()
  me 없음 → "First, your birthday" BirthForm → calcUserSaju → saveUserSaju → setMe
  me 있음 →
    상단: "Your saju · 辛卯 …" 요약 + "Edit on home" 링크
    [Your bias 섹션]  IdolPicker → compatForIdol(mePillars, idol) → 범용 모달
    [Or someone else 섹션] 이름(optional)+BirthForm → calcUserSaju(상대) → calcCompatibility(me, 상대) → 범용 모달
```
`mePillars = { year, month, day }`는 `userSaju.pillars`에서 직접 추출(server-only `toCompatPillars` 회피, 기존 패턴).

## 모듈 설계

### `src/lib/saju-storage.ts` (client-safe)
```ts
const KEY = "ksaju:userSaju:v1";
export function saveUserSaju(saju: UserSaju): void; // typeof window 가드, try/catch
export function loadUserSaju(): UserSaju | null;    // 없거나 JSON 손상 시 null
```
- SSR 안전(`typeof window === "undefined"` → no-op/null). manseryeok 미import.

### `CompatibilityModal` 일반화 (presentational)
- 변경 전 props: `{ open, onClose, mePillars, idol: Idol, result }` (내부에서 `normalizeIdolSaju`).
- 변경 후 props: `{ open, onClose, mePillars, other: { name: string; sub?: string; pillars: SajuPillars }, result, closeLabel?: string }`.
- 헤더: `You × {other.name}{other.sub ? ` · ${other.sub}` : ""}`. MiniSaju 라벨 `other.name`, pillars `other.pillars`. `normalizeIdolSaju` 호출은 **제거**(호출부가 pillars 전달). closeLabel 기본 `"← Close"`.

### `CompatibilitySection` (아이돌)
- 유지: `userSaju` prop, IdolPicker, `compatForIdol`. 모달 호출만 변경:
  `other={{ name: idol.name, sub: idol.group, pillars: normalizeIdolSaju(idol.saju) }}`, `closeLabel="← Check another idol"`.

### `PartnerCompatSection` (신규, `src/components/compat/partner-compat-section.tsx`, client)
- props `{ userSaju }`. 내부 상태: `partnerName`(controlled Input, optional, 검증 없음), `result`/`open`, `submitting`/`error`.
- 레이아웃: "Their name (optional)" `<Input>` + `<BirthForm onSubmit={handlePartner} submitLabel="Reveal compatibility ✨" submittingLabel="Reading…" />`.
- `handlePartner(birth)`: `setSubmitting(true)` → `const partner = await calcUserSaju(birth)` → `partnerPillars = {year,month,day}` → `calcCompatibility(mePillars, partnerPillars)` → 모달 open. other `{ name: partnerName.trim() || "Them", pillars: partnerPillars }`, closeLabel `"← Check someone else"`. 에러 시 destructive 배너(홈 패턴).

### `/inyeon/page.tsx` (server) + `InyeonView` (client)
- **패턴: 얇은 server page + client 자식** — metadata 유지(사이클 11 placeholder의 title/description 보존).
- `src/app/inyeon/page.tsx` (server, 수정): `export const metadata` 유지, 본문은 `<InyeonView />` 렌더만.
- `src/components/inyeon/inyeon-view.tsx` (신규, `"use client"`): 모든 로직.
  - mount 후 `loadUserSaju()` → `me` 상태 (mounted 가드 또는 useSyncExternalStore로 hydration 안전; SSR에선 me=null로 시작).
  - `me` 없음: 안내 + `BirthForm`(submitLabel "See my saju") → `calcUserSaju` → `saveUserSaju` → setMe.
  - `me` 있음: "Your saju" 요약(한자 기둥) + "Edit on home"(`<Link href="/">`) + `<CompatibilitySection userSaju={me} />` + 구분선 "Or someone else" + `<PartnerCompatSection userSaju={me} />`.
  - 한지 Card/디자인 토큰, 사이클 11 콘텐츠 컨테이너 폭 유지.

### 홈 변경
- `page.tsx`: `handleSubmit` 성공부에 `saveUserSaju(saju)` 추가(import from saju-storage).
- `SajuResult`: `<CompatibilitySection userSaju={userSaju} />` 제거 → 같은 자리에 CTA:
  `<Link href="/inyeon" className="...버튼풍...">Check your 인연 (compatibility) ✨ →</Link>`. (Button asChild 또는 링크 스타일.)
- `SajuResult`는 더 이상 CompatibilitySection import 안 함.

### `BirthForm` 일반화
- props 추가: `submitLabel?: string`(기본 "Discover your saju"), `submittingLabel?: string`(기본 "Reading your saju…"). 버튼 텍스트에 사용. 기존 호출부(홈)는 무변경(기본값).

## 테스트
- `src/lib/saju-storage.test.ts` (happy-dom): save→load 왕복 일치 / 미존재 시 null / 손상 JSON 시 null.
- `CompatibilityModal` 테스트: 범용 props로 갱신 — 아이돌 케이스(name+sub) + 상대 케이스(name만) 각각 점수·이름 렌더.
- `CompatibilitySection` 테스트: 일반화 props 반영해 갱신(아이돌 선택→모달 점수).
- `PartnerCompatSection` 테스트 (happy-dom): `vi.mock`으로 `@/app/actions/saju`의 `calcUserSaju` 모킹(고정 UserSaju 반환) → 이름 입력 + 생일 제출 → 모달에 점수/이름 노출.
- `InyeonView` 테스트 (happy-dom): `loadUserSaju` 모킹 — 저장된 me 있을 때 두 섹션(검색창 + 상대 폼) 렌더 / 없을 때 폴백 BirthForm 렌더.

## 검증
- `npm test` 전체 그린, `tsc`/`eslint`(기존 경고만), `next build` 성공. `/inyeon`은 client page라 동적/`○`여부 빌드 확인(기능상 무관, 사용자 입력 기반).
- 수동: 홈 사주→CTA→/inyeon에 내 사주 자동 표시→아이돌 궁합 + 상대(이름+생일) 궁합 모달. 새로고침 후 /inyeon 직접 접근 시 me 유지. me 없는 새 브라우저로 /inyeon 직접 → 폴백 폼.

## 재사용 자산
- `IdolPicker`, `compatForIdol`/`calcCompatibility`/`normalizeIdolSaju`(client-safe), `BirthForm`, `calcUserSaju`(server action), 한지 토큰/Card/Dialog.

## 미해결/주의
- `/inyeon`은 server page(metadata 유지) + client `InyeonView` 패턴 → 빌드 시 static prerender 가능(클라 로직은 mount 후 실행). metadata 보존됨.
- 직접 `/inyeon` 진입(미저장) UX: 폴백 폼으로 본인 사주 입력 — 홈과 중복 입력이나 localStorage로 1회성 해소.
- 홈 `saju-result.test.tsx`가 CompatibilitySection 노출을 검사했다면 CTA 링크 검사로 갱신 필요(구현 시 확인).
