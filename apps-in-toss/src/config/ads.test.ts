import { describe, expect, it } from "vitest";
import { AD_CONTROL_GAP_PX, BANNER_AD_GROUP_ID } from "./ads";

describe("배너 지면", () => {
  // 실 ID 로 개발 테스트를 하면 정책 위반이다. 테스트 런타임은 DEV 이므로
  // 여기서 라이브 지면이 보이면 개발 빌드가 라이브 지면을 쓰고 있다는 뜻이다.
  it("개발·테스트 환경은 라이브 지면을 쓰지 않는다", () => {
    expect(BANNER_AD_GROUP_ID).not.toMatch(/^ait\.v2\.live\./);
    expect(BANNER_AD_GROUP_ID).toBe("ait-ad-test-banner-id");
  });

  // 프로덕션 쪽은 단위 테스트보다 강한 보증이 이미 있다 — `ait build` 가 출시
  // 번들에서 테스트 지면 ID 문자열을 발견하면 `.ait` 생성을 거부한다.
  // 그래서 여기서는 개발 분기만 지킨다.
});

describe("광고 이격", () => {
  // 토스애즈 SSP: 조작 영역에서 최소 24px.
  it("SSP 오클릭 정책 하한을 지킨다", () => {
    expect(AD_CONTROL_GAP_PX).toBeGreaterThanOrEqual(24);
  });
});
