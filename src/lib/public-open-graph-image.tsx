import { ImageResponse } from "next/og";
export const alt =
  "Five Saint — Hidromasajes, spas y bañeras de fabricación nacional";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#021116",
        color: "white",
        fontFamily: "sans-serif",
        borderBottom: "18px solid #087d9f",
      }}
    >
      <div style={{ fontSize: 28, color: "#9de6f2", letterSpacing: 6 }}>
        FABRICACIÓN NACIONAL DESDE 1995
      </div>
      <div style={{ fontSize: 94, fontWeight: 700, marginTop: 36 }}>
        FIVE SAINT
      </div>
      <div style={{ fontSize: 40, marginTop: 28, lineHeight: 1.3 }}>
        Hidromasajes, spas y bañeras
      </div>
      <div style={{ fontSize: 26, color: "#d6d3d1", marginTop: 28 }}>
        Diseño, confort y bienestar
      </div>
    </div>,
    size,
  );
}
