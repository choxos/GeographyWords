import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";

/**
 * Full-bleed layout for the two screens where the map IS the interface.
 * The page below fills exactly the viewport minus the 60px header.
 */
export default function FullLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <Header compact />
      <main style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</main>
    </div>
  );
}
