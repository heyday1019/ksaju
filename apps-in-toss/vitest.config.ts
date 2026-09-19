import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    // 화면/엔진을 동적 import(코드 스플리팅) 하므로 첫 로드에 여유를 준다
    testTimeout: 30000,
  },
});
