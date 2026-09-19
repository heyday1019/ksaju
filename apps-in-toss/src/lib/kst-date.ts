/**
 * 오늘의 KST 날짜 `YYYY-MM-DD`.
 *
 * 타로와 오늘의 운세가 같이 쓰므로 tarot.ts 밖에 둔다 — 거기서 가져오면
 * '내 사주' 화면이 타로 카드 데이터(별도 청크)까지 끌고 온다.
 */
export function kstDateString(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}
