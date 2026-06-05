import { ImageResponse } from "next/og";

// Image metadata (Next.js file-convention exports)
export const alt = "KSaju — Saju, but make it K.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Hanji palette (CLAUDE.md): cream / ink / 진달래 pink / 단청황 gold.
// Latin-only text — no font fetch — keeps the build robust (CJK deferred).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#FBF6E8",
          color: "#1A1A2E",
          padding: "80px",
          position: "relative",
          fontFamily: "serif",
        }}
      >
        {/* 井 (well) grid motif — decorative lines */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          <div style={{ position: "absolute", left: "33%", top: 0, bottom: 0, width: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", left: "66%", top: 0, bottom: 0, width: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", top: "33%", left: 0, right: 0, height: 2, background: "#C49A3F", opacity: 0.25 }} />
          <div style={{ position: "absolute", top: "66%", left: 0, right: 0, height: 2, background: "#C49A3F", opacity: 0.25 }} />
        </div>

        <div style={{ display: "flex", fontSize: 140, fontWeight: 700, letterSpacing: -2 }}>
          KSaju
        </div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, color: "#C8385A", marginTop: 8 }}>
          Saju, but make it K.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#1A1A2E", opacity: 0.6, marginTop: 40 }}>
          ksaju.me
        </div>
      </div>
    ),
    { ...size },
  );
}
