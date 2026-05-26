// jest-dom matcher 등록 (toBeInTheDocument, toHaveAttribute 등).
// 전역 환경은 node이고 컴포넌트 테스트만 `@vitest-environment happy-dom`
// pragma로 DOM을 켠다. 이 import는 expect를 확장만 하므로 node 테스트에서도 무해.
import "@testing-library/jest-dom/vitest";
