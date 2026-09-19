import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import App from "./App";

test("자체 헤더를 렌더하지 않는다 (앱 이름/로고는 토스 공통 내비게이션 담당)", () => {
  render(<App />);
  expect(screen.queryByRole("banner")).toBeNull();
});

test("탭바로 화면을 전환하고, 전환은 history 에 쌓여 백버튼으로 되돌아온다", async () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: "생일만 알려주세요" }),
  ).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "궁합" }));
  expect(
    await screen.findByRole("heading", { name: "궁합" }),
  ).toBeInTheDocument();
  expect(window.history.state).toEqual({ screen: "compat" });
});

test("첫 화면(생일 입력)에서는 광고를 올리지 않는다", () => {
  // 외부 광고 SDK 가 '최초 접속' 구간에 얹히면 로딩 시간 심사에 걸린다.
  // 광고 없이 뜨는 화면이어야 하고, 광고 자리 라벨도 보이지 않아야 한다.
  render(<App />);
  expect(screen.getByRole("heading", { name: "생일만 알려주세요" })).toBeInTheDocument();
  expect(screen.queryByText("광고")).toBeNull();
});

test("타로 스프레드 탭 이름이 기능을 알 수 있게 '타로 3장' 이다", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: "타로 3장" })).toBeInTheDocument();
});
