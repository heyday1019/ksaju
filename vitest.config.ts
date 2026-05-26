import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // "server-only"는 node-env 테스트에서 import 시 throw → 빈 stub으로 대체.
      // 실제 next 빌드에선 원본이 클라이언트 번들 침투를 막는다.
      "server-only": path.resolve(__dirname, "./test/server-only.stub.ts"),
    },
  },
});
