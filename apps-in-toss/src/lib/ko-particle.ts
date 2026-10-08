// 한국어 조사 붙이기.
//
// 규칙기반 문장을 조립하는 곳이 늘어나면서(오행 해설, 타로 리딩) 같은 코드가
// 두 번 생겼다. 조사가 틀리면 "화이 두텁고" 처럼 바로 어색해지므로 한곳에 둔다.

/** 한글 음절에 종성(받침)이 있는지. */
export function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return false;
  return code % 28 !== 0;
}

/** `목` → `목이`, `화` → `화가` */
export function withSubject(word: string): string {
  return word + (hasFinalConsonant(word) ? "이" : "가");
}

/** `목` → `목은`, `화` → `화는` */
export function withTopic(word: string): string {
  return word + (hasFinalConsonant(word) ? "은" : "는");
}

/** `출발` → `출발로`, `모험` → `모험으로` */
export function withDirection(word: string): string {
  const last = word.charCodeAt(word.length - 1) - 0xac00;
  // 'ㄹ' 받침은 '로' 를 쓴다 (출발로, 시작으로)
  const jong = last >= 0 && last <= 11171 ? last % 28 : 0;
  return word + (jong === 0 || jong === 8 ? "로" : "으로");
}

/** `불씨` → `불씨와`, `의욕` → `의욕과` */
export function withAnd(word: string): string {
  return word + (hasFinalConsonant(word) ? "과" : "와");
}

/** `["a","b","c"]` → `a와 b와 c` (각 낱말의 받침에 맞춰 와/과) */
export function joinWithAnd(words: string[]): string {
  return words.reduce((acc, w, i) => (i === 0 ? w : `${withAnd(acc)} ${w}`));
}
