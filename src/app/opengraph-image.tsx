import { ImageResponse } from "next/og";

export const alt = "Thoughts Whatever — Bengali literature, essays and archival stories";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SocialImage() {
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", background: "#0d0d0e", color: "#e8e6e1", padding: 90 }}>
    <div style={{ fontSize: 30, color: "#e0703c", marginBottom: 36 }}>t.w / A Little Bit More</div>
    <div style={{ fontSize: 86, fontWeight: 700 }}>Thoughts Whatever</div>
    <div style={{ fontSize: 30, color: "#b7b4ac", marginTop: 36 }}>Bengali literature · Essays · Archival stories</div>
    <div style={{ fontSize: 24, color: "#b7b4ac", marginTop: 60 }}>thoughtswhatever.in</div>
  </div>, size);
}
