// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShareCardFooter } from "./share-card-footer";

describe("ShareCardFooter", () => {
  it("renders the branded QR, Make-yours CTA and disclaimer", () => {
    render(<ShareCardFooter />);
    const qr = screen.getByAltText(/make your own/i);
    expect(qr).toHaveAttribute("src", "/ksaju-qr.png");
    expect(screen.getByText(/Make yours/i)).toBeInTheDocument();
    expect(screen.getByText("ksaju.me")).toBeInTheDocument();
    expect(screen.getByText(/For entertainment/)).toBeInTheDocument();
  });
});
