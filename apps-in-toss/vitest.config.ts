import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    // 화면/엔진을 동적 import(코드 스플리팅) 하므로 첫 로드에 여유를 준다.
    //
    // 이 예산은 **스위트 크기에 따라 늘어난다.** 테스트 파일마다 워커가 모듈
    // 그래프를 새로 변환하는데, 만세력(300KB)이 그 비용의 대부분이다. 파일이
    // 늘면 단독으로는 통과하는 테스트가 전체 실행에서만 타임아웃으로 깨진다
    // (실제로 타로 리딩 작업에서 파일 2개를 더하고 5건이 한꺼번에 깨졌다).
    // 런타임이 느린 게 아니므로, 깨지면 로직보다 먼저 이 숫자를 의심할 것.
    testTimeout: 45000,
  },
});
