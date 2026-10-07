// 앱인토스 콘솔 '핵심 지표'(전환 지표)가 읽는 이벤트 로그.
//
// 콘솔 로그 카탈로그에는 `log_name` 이 **그대로** 쌓인다 — `::impression` 같은
// 접미사는 붙지 않는다(2026-09-24 실제 수집분으로 확인).
// 예) logSajuResult() → `saju_result`
// 이 이름을 그대로 전환 지표(EVENT_LOG)의 eventName 에 넣는다.
// 그래서 **이름을 바꾸면 콘솔 지표가 조용히 0이 된다** — 상수를 함부로 고치지 말 것.
//
// 2026-10-22 부터 토스 노출 정책이 등급제(출시/추천/부스팅)로 바뀌고,
// 추천 선정 기준의 하나인 '전환율'을 여기 등록된 지표로 계산한다.
// 이 앱은 그전까지 커스텀 로그가 하나도 없어서 전환율을 낼 수 없었다.
//
// 규칙:
//  - SDK 는 반드시 **동적 import**. 정적 import 는 웹에서 크래시 + 심사 반려(BannerAd 와 같은 이유).
//  - 로깅 실패가 화면을 막지 않는다. 토스 앱 밖(웹·샌드박스·vitest)에서는 조용히 넘어간다.
//  - 생일·이름 같은 개인정보는 파라미터에 절대 넣지 않는다. 앱은 외부통신 0 원칙을 지킨다.

type Params = Record<string, string | number | boolean>;

/** 콘솔 로그 이름. 전환 지표가 이 문자열에 묶여 있다. */
export const LOG = {
  /** 생일을 넣고 사주 4기둥 결과까지 도달 — 이 앱이 약속한 가치가 전달된 순간(대표 전환). */
  sajuResult: "saju_result",
  /** 궁합 결과를 실제로 확인. */
  compatResult: "compat_result",
  /** 오늘의 타로를 실제로 확인. */
  tarotResult: "tarot_result",
  /** 공유 카드를 사진첩/파일로 **저장 성공**. 모달을 연 것과 구분한다(확산 신호). */
  shareSaved: "share_saved",
  /** 오늘의 운세 카드가 실제로 보인 순간. 티저(생일 없음)와 카드를 state 로 구분. */
  dailyFortuneOpen: "daily_fortune_open",
  /**
   * 토스 공유 시트를 띄운 순간 — **신규 유입이 생기는 유일한 경로**.
   * `share_saved`(사진첩 저장)와 다르다. 저장은 아무도 받지 않고 그 뒤를 측정할 수
   * 없는데, 그동안 이것만 계측하고 있어서 '공유 5건'을 '저장 5건'으로 오독했다.
   */
  shareClicked: "share_clicked",
} as const;

/**
 * SDK 모듈 promise 를 한 번만 만들어 돌려쓴다.
 *
 * 호출마다 `await import()` 를 새로 하면 같은 틱에 여러 로그가 나갈 때
 * (예: 결과 도달 + 운세 노출이 한 번의 effect flush 에서 같이 발생)
 * 모듈 로더에 따라 첫 건만 살고 나머지가 조용히 유실된다 — `catch` 가 가려서
 * 눈에도 안 띈다. 실제로 vitest 에서 6건을 한 틱에 보내면 1건만 기록됐다.
 * 하나의 promise 를 공유하면 호출 순서와 무관하게 전부 도착한다.
 */
let sdk: Promise<typeof import("@apps-in-toss/web-framework")> | null = null;

function loadSdk() {
  sdk ??= import("@apps-in-toss/web-framework").catch((e: unknown) => {
    sdk = null; // 실패를 캐시하지 않는다 — 다음 로그에서 다시 시도한다
    throw e;
  });
  return sdk;
}

async function send(
  kind: "screen" | "impression" | "click",
  logName: string,
  params?: Params,
): Promise<void> {
  try {
    const { Analytics } = await loadSdk();
    await Analytics[kind]({ log_name: logName, ...params });
  } catch {
    // 토스 앱 밖이거나 SDK 가 없는 환경. 계측은 부가 기능이라 삼킨다.
  }
}

/** 탭 화면 진입. 콘솔에 `saju::screen` 처럼 탭별로 쌓인다(지금은 `/::screen` 하나뿐). */
export function logScreen(tab: string, params?: Params): void {
  void send("screen", tab, params);
}

/** 사주 4기둥 결과 도달. */
export function logSajuResult(params?: Params): void {
  void send("impression", LOG.sajuResult, params);
}

/** 궁합 결과 확인. `kind` 로 아이돌/사람 궁합을 구분한다. */
export function logCompatResult(kind: "idol" | "person"): void {
  void send("impression", LOG.compatResult, { kind });
}

/** 오늘의 타로 확인. */
export function logTarotResult(): void {
  void send("impression", LOG.tarotResult);
}

/** 공유 카드 저장 성공. `how` 는 사진첩(saved) / 파일 다운로드(downloaded). */
export function logShareSaved(card: string, how: string): void {
  void send("click", LOG.shareSaved, { card, how });
}

/** 오늘의 운세 노출. `state` = 생일이 없어 티저만 보인 경우(teaser) / 실제 카드(card). */
export function logDailyFortuneOpen(state: "teaser" | "card"): void {
  void send("impression", LOG.dailyFortuneOpen, { state });
}

/** 토스 공유 시트를 띄웠다. `from` 은 어느 화면에서 눌렀는지. */
export function logShareClicked(from: string): void {
  void send("click", LOG.shareClicked, { from });
}
