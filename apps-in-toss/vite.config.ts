import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // .ait 안에서 웹 자산은 `web/` 하위에 담겨 https 오리진의 '하위 경로'로 서빙된다.
  // 기본값('/')이면 index.html 이 /assets/... 를 오리진 루트에서 찾다가 404 → 흰 화면.
  // (심사 반려 사유 1 "앱 스킴 접속 불가" + 2 "20초 초과"의 원인)
  base: "./",
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // 부팅에 필요 없는 무거운 모듈을 초기 청크에서 떼어낸다.
        manualChunks(id: string) {
          if (id.includes("@fullstackfamily/manseryeok")) return "manseryeok";
          if (id.includes("html-to-image")) return "html-to-image";
          // 데이터는 파일별로 쪼갠다. 한 덩어리로 묶으면 운세 i18n(11KB) 하나
          // 때문에 아이돌 DB(60KB)·타로(24KB)까지 사주 화면에서 받아간다.
          if (id.includes("ksaju-idol-db")) return "data-idols";
          if (id.includes("ksaju-tarot")) return "data-tarot";
          if (id.includes("ksaju-readings")) return "data-readings";
          if (id.includes("ksaju-fortune-i18n")) return "data-fortune";
        },
      },
    },
  },
});
