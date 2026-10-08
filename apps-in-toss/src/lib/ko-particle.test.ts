import { describe, expect, it } from "vitest";
import {
  hasFinalConsonant,
  joinWithAnd,
  withAnd,
  withDirection,
  withSubject,
  withTopic,
} from "./ko-particle";

describe("한국어 조사", () => {
  it("종성을 판별한다", () => {
    expect(hasFinalConsonant("목")).toBe(true);
    expect(hasFinalConsonant("화")).toBe(false);
  });

  it("주격 이/가", () => {
    expect(withSubject("목")).toBe("목이");
    expect(withSubject("화")).toBe("화가");
    expect(withSubject("두려움")).toBe("두려움이");
  });

  it("주제격 은/는", () => {
    expect(withTopic("금")).toBe("금은");
    expect(withTopic("수")).toBe("수는");
  });

  // 'ㄹ' 받침은 '으로' 가 아니라 '로' 를 쓴다.
  it("방향격 로/으로", () => {
    expect(withDirection("의욕")).toBe("의욕으로");
    expect(withDirection("충만")).toBe("충만으로");
    expect(withDirection("투자")).toBe("투자로");
    expect(withDirection("출발")).toBe("출발로");
  });

  it("접속 와/과", () => {
    expect(withAnd("불씨")).toBe("불씨와");
    expect(withAnd("의욕")).toBe("의욕과");
  });

  it("여러 낱말을 받침에 맞춰 잇는다", () => {
    expect(joinWithAnd(["불씨", "의욕"])).toBe("불씨와 의욕");
    expect(joinWithAnd(["의욕", "불씨"])).toBe("의욕과 불씨");
    expect(joinWithAnd(["하나"])).toBe("하나");
  });

  // 한글이 아닌 글자가 들어와도 죽지 않는다.
  it("한글이 아니면 받침 없음으로 본다", () => {
    expect(hasFinalConsonant("A")).toBe(false);
    expect(() => withSubject("")).not.toThrow();
  });
});
