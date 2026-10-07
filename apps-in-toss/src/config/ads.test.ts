import { describe, expect, it } from "vitest";
import {
  AD_CONTROL_GAP_PX,
  BANNER_AD_GROUP_ID,
  resolveBannerAdGroupId,
} from "./ads";

describe("배너 지면 결정", () => {
  // 프로덕션이 env 에 의존하면, 빌드 설정이 한 번 빠졌을 때 라이브 번들이
  // 조용히 테스트 지면으로 나간다. 화면은 정상인데 수익만 0이 된다.
  it("프로덕션은 env 와 무관하게 라이브 지면을 쓴다", () => {
    expect(resolveBannerAdGroupId({ dev: false })).toBe(
      "ait.v2.live.14d7a4538d864d74",
    );
    expect(
      resolveBannerAdGroupId({ dev: false, override: "ait-ad-test-banner-id" }),
    ).toBe("ait.v2.live.14d7a4538d864d74");
  });

  // 실 ID 로 개발 테스트를 하면 정책 위반이다.
  it("개발 빌드는 기본적으로 테스트 지면을 쓴다", () => {
    expect(resolveBannerAdGroupId({ dev: true })).toBe("ait-ad-test-banner-id");
  });

  it("개발 빌드에서만 env 로 지면을 덮어쓸 수 있다", () => {
    expect(
      resolveBannerAdGroupId({ dev: true, override: "ait.v2.live.other" }),
    ).toBe("ait.v2.live.other");
  });

  it("빈 override 는 테스트 지면으로 떨어진다", () => {
    expect(resolveBannerAdGroupId({ dev: true, override: "" })).toBe(
      "ait-ad-test-banner-id",
    );
  });

  // 테스트 런타임은 DEV 다 — 라이브 지면이 새어 들어오면 안 된다.
  it("테스트 환경에서 라이브 지면이 쓰이지 않는다", () => {
    expect(BANNER_AD_GROUP_ID).not.toMatch(/^ait\.v2\.live\./);
  });
});

describe("광고 이격", () => {
  // 토스애즈 SSP: 조작 영역에서 최소 24px.
  it("SSP 오클릭 정책 하한을 지킨다", () => {
    expect(AD_CONTROL_GAP_PX).toBeGreaterThanOrEqual(24);
  });
});
