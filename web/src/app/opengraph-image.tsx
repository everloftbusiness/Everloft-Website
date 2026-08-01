import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(212,175,55,0.35), transparent 55%), radial-gradient(circle at 10% 90%, rgba(37,99,235,0.3), transparent 55%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: "#0f172a",
              border: "2px solid #d4af37",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              color: "#d4af37",
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, color: "#ffffff" }}>Everloft</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: "#e5e7eb", letterSpacing: 1 }}>
          Stay Beyond Expectations
        </div>
      </div>
    ),
    { ...size }
  );
}
