// ============================================================
// 출시 기념 토스포인트 프로모션 (서버리스)
//
// 토스 로그인도 서버도 없이 SDK 두 개로 끝낸다:
//   getAnonymousKey()      로그인 없이 사용자별로 안정적인 hash
//   grantPromotionReward() 토스포인트 지급
//
// 중복 방어는 hash 기준 원장으로 한다. localStorage 만 쓰면 앱 데이터 삭제·
// 재설치로 초기화되지만, hash 로 네임스페이싱하면 한 기기를 여러 계정이 써도
// 기록이 섞이지 않는다. 서버가 없으므로 이게 한계이고, 예산 5,000원 · 1인
// 최대 30원이라 감당 가능한 수준이라 택했다.
// ============================================================

/** 콘솔에서 발급받은 프로모션 코드. */
export const PROMOTION_CODE = "01M342SD79WN25KXZZBYYPS27Y";

/**
 * 프로모션은 `TEST_` 코드로 실기기에서 1회 호출해야 정상 상태가 된다
 * (건너뛰면 라이브에서 4100). 서버리스라 그 호출도 앱이 해야 하는데,
 * 그것만을 위해 번들을 따로 만들면 검수 번들과 갈라진다.
 * 그래서 `?promo=test` 가 붙은 링크로 열었을 때만 테스트 코드를 쓴다.
 * 테스트 호출은 포인트가 차감되지도 지급되지도 않고, 일반 사용자와
 * 심사자는 이 플래그 없이 진입하므로 실제 동작에 영향이 없다.
 *
 * 딥링크의 쿼리는 WebView 의 `location.search` 에 실리지 않는다 —
 * 미니앱은 `https://{appName}.apps.tossmini.com` 에서 서빙되기 때문이다.
 * 진입 스킴은 `getSchemeUri()` 로만 읽을 수 있다.
 */
export async function isTestMode(): Promise<boolean> {
  try {
    const { getSchemeUri } = await import("@apps-in-toss/web-framework");
    if (/[?&]promo=test(?:&|$)/.test(getSchemeUri() ?? "")) return true;
  } catch {
    /* 토스 앱 밖에서는 스킴이 없다 */
  }
  try {
    // 브라우저에서 확인할 때의 경로
    return new URLSearchParams(window.location.search).get("promo") === "test";
  } catch {
    return false;
  }
}

async function resolveCode(): Promise<string> {
  return (await isTestMode()) ? `TEST_${PROMOTION_CODE}` : PROMOTION_CODE;
}

export type Mission = "saju" | "share";

/** 미션별 지급액. 합계가 프로모션의 1일 한도(30원)와 같다. */
export const MISSION_AMOUNT: Record<Mission, number> = { saju: 10, share: 20 };

export const MISSION_LABEL: Record<Mission, string> = {
  saju: "내 사주 확인하기",
  share: "친구에게 공유하기",
};

export type UserKey =
  | { ok: true; hash: string }
  | { ok: false; reason: "UNSUPPORTED" | "ERROR" };

/** 로그인 없이 사용자 식별. 반환 4가지를 모두 처리한다. */
export async function fetchUserHash(): Promise<UserKey> {
  try {
    // SDK 는 동적 import (정적 import 는 웹에서 크래시 + 심사 반려)
    const { getAnonymousKey } = await import("@apps-in-toss/web-framework");
    const r = await getAnonymousKey();
    if (!r) return { ok: false, reason: "UNSUPPORTED" };
    if (r === "ERROR") return { ok: false, reason: "ERROR" };
    return { ok: true, hash: r.hash };
  } catch {
    return { ok: false, reason: "UNSUPPORTED" };
  }
}

// ---- hash 기준 원장 (1인 1회) ----

const ledgerKey = (hash: string) => `ksaju.promo.v1:${hash}`;

type Ledger = Partial<Record<Mission, string>>; // mission → rewardKey

function readLedger(hash: string): Ledger {
  try {
    return JSON.parse(localStorage.getItem(ledgerKey(hash)) ?? "{}") as Ledger;
  } catch {
    return {};
  }
}

export function hasClaimed(hash: string, mission: Mission): boolean {
  return Boolean(readLedger(hash)[mission]);
}

function recordClaim(hash: string, mission: Mission, rewardKey: string): void {
  try {
    const l = readLedger(hash);
    l[mission] = rewardKey;
    localStorage.setItem(ledgerKey(hash), JSON.stringify(l));
  } catch {
    // 저장 실패해도 지급은 이미 끝났다 — 화면 상태만 유지되지 않을 뿐이다
  }
}

// ---- 지급 ----

export type GrantResult = { ok: true } | { ok: false; code: string };

/**
 * SDK 는 실패를 두 가지 모양으로 돌려준다 — `{ errorCode, message }` 와
 * `{ code, ... }`. 한쪽만 보면 나머지가 조용히 "알 수 없는 오류"로 떨어진다.
 */
function errorCodeOf(r: object): string {
  if ("errorCode" in r) return String((r as { errorCode: unknown }).errorCode);
  if ("code" in r) return String((r as { code: unknown }).code);
  return "ERROR";
}

/** 사용자에게 보여줄 문구. 에러 코드를 그대로 노출하지 않는다. */
export function grantMessage(code: string): string {
  switch (code) {
    case "NO_USER_KEY":
      return "사용자 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";
    case "UNSUPPORTED":
      return "토스 앱을 최신 버전으로 업데이트해 주세요.";
    case "ALREADY_GRANTED":
      return "이미 받으셨어요.";
    case "4100":
      return "이벤트 정보를 찾을 수 없어요.";
    case "4109":
    case "4112":
      return "이벤트가 종료되었어요.";
    case "4110":
      return "일시적인 오류예요. 다시 시도해 주세요.";
    case "4114":
    case "4116":
      return "지급 한도를 초과했어요.";
    default:
      return "토스포인트 지급 중 오류가 발생했어요.";
  }
}

/** 예산 소진·미등록처럼 재시도가 무의미한 상태 — 지급 UI 를 닫아야 한다. */
export function isTerminal(code: string): boolean {
  return code === "4109" || code === "4112" || code === "4100";
}

export async function grantReward(
  hash: string,
  mission: Mission,
): Promise<GrantResult> {
  if (hasClaimed(hash, mission)) return { ok: false, code: "ALREADY_GRANTED" };

  const params = {
    promotionCode: await resolveCode(),
    amount: MISSION_AMOUNT[mission],
  };

  try {
    const { grantPromotionReward } = await import("@apps-in-toss/web-framework");

    // 반환 4갈래를 순서대로 좁힌다 — { key } 와 { errorCode } 는 둘 다 객체라
    // truthy 체크만으로는 실패를 성공으로 처리하게 된다.
    let r = await grantPromotionReward({ params });
    if (!r) return { ok: false, code: "UNSUPPORTED" };
    if (r === "ERROR") return { ok: false, code: "ERROR" };

    // 4110(내부 오류)만 재시도할 가치가 있다. 나머지는 다시 불러도 같은 결과다.
    if (!("key" in r) && errorCodeOf(r) === "4110") {
      await new Promise((res) => setTimeout(res, 500));
      const retry = await grantPromotionReward({ params });
      if (retry && retry !== "ERROR") r = retry;
    }

    if ("key" in r) {
      recordClaim(hash, mission, r.key as string);
      return { ok: true };
    }
    return { ok: false, code: errorCodeOf(r) };
  } catch {
    return { ok: false, code: "ERROR" };
  }
}
