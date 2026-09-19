import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// 화면/만세력 엔진을 동적 import(코드 스플리팅) 하므로 findBy* 대기를 넉넉히 둔다.
// 런타임이 느린 게 아니라, vitest 가 manseryeok(300KB)을 최초 1회 변환하는 비용이다.
configure({ asyncUtilTimeout: 15000 });
