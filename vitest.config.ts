import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // apps-in-toss/ 는 자체 vitest 설정(happy-dom + react 플러그인)과 node_modules 를 가진
    // 독립 SPA 다. 여기서 끌어다 돌리면 node 환경·플러그인 부재로 전부 실패한다.
    // 그쪽 테스트는 `cd apps-in-toss && npm test` 로 돌린다.
    exclude: [...configDefaults.exclude, "apps-in-toss/**"],
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
