import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const OG_SIZE = { width: 1200, height: 630 };

/** Share card, painted with the light-theme tokens from globals.css. */
export function ogCard({
  lemma,
  hook,
  placeLine,
}: {
  lemma: string;
  hook: string;
  placeLine: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAFAF7",
          color: "#0B0B0A",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 9,
              background: "#0B0B0A",
              color: "#FAFAF7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            X
          </div>
          <div style={{ fontSize: 24, color: "#56564E" }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: lemma.length > 12 ? 104 : 132,
              lineHeight: 0.9,
              letterSpacing: "-0.045em",
              color: "#0B0B0A",
            }}
          >
            {lemma}
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 38,
              lineHeight: 1.28,
              color: "#0F47F7",
              maxWidth: 940,
            }}
          >
            {hook}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#DC2626",
            }}
          />
          <div style={{ fontSize: 26, color: "#56564E", letterSpacing: "0.02em" }}>
            {placeLine}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
