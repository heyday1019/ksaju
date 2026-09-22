import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { vi } from "vitest";

// 앱인토스 SDK 는 토스 앱 안에서만 의미가 있다. 테스트에서 실제 번들을 끌어오면
// 브리지가 없어 쓸모도 없으면서 변환 비용만 얹혀 전체 실행이 타임아웃한다
// (계측 추가 후 App.test 가 단독으로는 통과하는데 전체에서만 깨졌던 원인).
// 광고·계측은 부가 기능이라 기본값은 '아무 일도 하지 않음' 으로 둔다.
// 호출 내용을 검증해야 하는 테스트는 파일에서 vi.mock 으로 다시 덮어쓴다.
vi.mock("@apps-in-toss/web-framework", () => ({
  Analytics: { screen: vi.fn(), impression: vi.fn(), click: vi.fn() },
  TossAds: {
    initialize: Object.assign(vi.fn(), { isSupported: () => false }),
    attachBanner: vi.fn(() => ({ destroy: vi.fn() })),
  },
}));

// 화면/만세력 엔진을 동적 import(코드 스플리팅) 하므로 findBy* 대기를 넉넉히 둔다.
// 런타임이 느린 게 아니라, vitest 가 manseryeok(300KB)을 최초 1회 변환하는 비용이다.
configure({ asyncUtilTimeout: 15000 });
