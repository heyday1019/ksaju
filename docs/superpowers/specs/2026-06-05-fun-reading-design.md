# 궁합 카드 fun 리딩 (큐레이티드 라이브러리) — 사이클 16 설계 문서

> 작성일: 2026-06-05 · 상태: 승인됨 (브레인스토밍 통과)
> 맥락: 사용자 갭 리스트 #1(🔴 가장 큰 갭). "점수+레이블=분석, 내러티브=감정. 사람은 감정을 공유한다." 공유 욕구를 일으키는 결정적 요소.

## 한 줄 요약

궁합 카드에 **개인화된 2-3줄 fun 영문 내러티브**를 추가해 공유 욕구를 높인다. LLM은 **오프라인 저작 도구**로만 사용(런타임 호출·API키·KV 없음): 카피 라이브러리를 **사전 생성 + 사람 리뷰** 후 정적 JSON으로 출하하고, 런타임은 `fortune.ts`처럼 순수 함수로 결정적 선택. 비용·지연·미성년 안전성 0 리스크.

## 원칙
- **런타임 LLM 미사용** — 결정적·즉시·무료·오프라인 안전(전 라인 사전 리뷰). teen 청중 안전.
- 개인화 축(내 오행 × 상대 오행 × 점수 티어)은 **유한** → 라이브러리로 동일한 "Your Fire meets her Fire" 매직 구현.
- 톤: 영문·fun·라이트·건전(teen)·shippy하되 로맨틱 진지 X·이모지 OK·2-3줄.
- 내러티브가 카드의 **감정 히어로**. 분석(breakdown)은 공유 동인이 아니므로 카드에서 제거.

## 범위

### 포함
1. `data/ksaju-readings.json` (신규, 큐레이티드 카피) — 28 스니펫(25 정렬 오행쌍 + 3 점수티어).
2. `src/lib/reading.ts` (신규, 순수 함수) — `getReading(mePillars, otherPillars, score)` → 결정적 2-3줄.
3. `src/lib/reading.test.ts` — 결정성·오행파생·티어경계·전 셀 해결.
4. `CompatShareCard` 개편 — 내러티브 히어로 추가 + breakdown 불릿 **제거**.
5. 사용자 카피 리뷰(저작은 구현 중 Claude가, 출하 전 사용자 검토).

### 비포함
- 런타임 LLM / API 키 / KV 캐시 / 콘텐츠 모더레이션 파이프라인.
- 운세(fortune) 카드 내러티브(후속; 별도 카드).
- 다국어(영문만).
- LLM 라이브 생성 업그레이드(향후 동일 `getReading` 시임 뒤로 교체 가능 — 설계상 열어둠).

## 데이터 모델 (`data/ksaju-readings.json`)
2축 합성:
- **정렬 오행쌍** `pairs[myElement][theirElement]` (5×5=25) → 두 오행을 오행별 이미지로 부르는 1-2줄 코어. 오행 이미지: fire→spark/burn, water→flow, wood→grow, metal→sharp/edge, earth→steady/ground.
- **점수 티어** `tiers[tier]` (high ≥75 / mid 50-74 / low <50) → 마무리 한 줄(3).

```json
{
  "pairs": {
    "fire": { "fire": "Your Fire meets their Fire — twin sparks that just get each other.", "water": "Your Fire meets their Water — steam, tension, and undeniable pull.", "...": "..." },
    "water": { "...": "..." },
    "...": {}
  },
  "tiers": {
    "high": "You'd shine brightest side by side. ✨",
    "mid": "Different energies, real spark — worth the dance. 💫",
    "low": "Opposites that test each other — handle with care. 🌙"
  }
}
```
리딩 = `pairs[myEl][theirEl]` + " " + `tiers[tier]` (2-3줄). 정렬(내가 앞) — "Your X meets their Y" 방향성 유지.

오행 키는 `WuXing` 타입(`wood|fire|earth|metal|water`)과 일치(소문자).

## 런타임 선택 (`src/lib/reading.ts`)
```
getReading(mePillars: SajuPillars, otherPillars: SajuPillars, score: number): string
  myEl   = STEM_ELEMENT[mePillars.day[0]]
  theirEl = STEM_ELEMENT[otherPillars.day[0]]
  tier   = score>=75 ? "high" : score>=50 ? "mid" : "low"
  return `${pairs[myEl][theirEl]} ${tiers[tier]}`
```
- 입력만으로 결정적(같은 쌍·점수 → 같은 리딩). 재오픈·재공유 안정.
- compatibility.ts의 `STEM_ELEMENT`는 모듈 private이므로, reading.ts가 `HEAVENLY_STEMS`(saju-data)에서 동일하게 파생(`Object.fromEntries(HEAVENLY_STEMS.map(s=>[s.char,s.element]))`). 동일 단일 소스 → DRY.
- 미지 오행/누락 셀 방어: 타입상 5×5 전부 채움 → 누락 시 테스트가 실패. 런타임 폴백 문자열은 두지 않음(데이터 완전성을 테스트로 보장).

## 렌더 — 카드 히어로 (`CompatShareCard`)
- 배치: 점수/레이블 **바로 아래** 내러티브(현재 빈 공간) = 감정 센터피스. font-serif, 가독 크기.
- **breakdown 불릿(Day Master / Branch) 제거** — 분석은 공유 동인이 아님. (compatibility 엔진의 breakdown 계산 자체는 유지; 카드에서 미표시.)
- 카드 구성(상→하): changsal · You × {name} · score/label · **reading(히어로)** · 양쪽 미니사주 · ksaju.me · For entertainment 🌙.
- 리딩은 공유 PNG에 포함(피처의 핵심).

## 범위: 아이돌 + 일반 상대
카드·`getReading`는 오행+점수만 사용 → CompatibilitySection(아이돌)·PartnerCompatSection(상대) **둘 다 자동 적용**. **결정: `CompatShareCard`가 내부에서 `getReading(mePillars, other.pillars, result.score)` 직접 호출**(이미 보유한 props로 충분 — prop 스레딩·모달/섹션 변경 불필요).

## 톤 & 안전
영문·fun·라이트·건전·2-3줄·이모지. 전 라인 정적 JSON에 존재 + 사용자 리뷰 → 미검증 카피 출하 0.

## 테스트 (vitest)
- `reading.test.ts`: (a) 결정성(동일 입력 → 동일 출력), (b) 오행 파생(day[0] → element) 정확, (c) 티어 경계(74→mid,75→high,49→low,50→mid), (d) **전 25 오행쌍 × 3 티어 해결**(missing 셀 없음 — JSON 완전성), (e) 출력이 pairLine+tierTail 합성.
- CompatShareCard: 리딩 텍스트 렌더 + breakdown 불릿 부재 확인(기존 테스트 갱신).
- 빌드/전체 스위트 그린.

## 검증
- `npm test` 그린(신규 reading + 갱신 카드 테스트).
- `npx tsc --noEmit` clean, `npm run lint` 신규 경고 0.
- `npm run build` 성공.
- 분석 연계: `card_shared` 이벤트로 리딩 도입 전후 공유율 비교 가능(사이클 15 PostHog).

## 비목표 가드
- 런타임 LLM·API키·KV 금지(오프라인 저작만).
- 카드에 breakdown 불릿 재노출 금지.
- 영문 외 다국어 금지(v1).
