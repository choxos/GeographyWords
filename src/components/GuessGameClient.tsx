"use client";

import dynamic from "next/dynamic";

/**
 * The game shuffles its deck at first render, so server and client would
 * disagree on the word. It needs WebGL regardless, so it renders client-only.
 */
export const GuessGameClient = dynamic(
  () => import("./GuessGame").then((mod) => mod.GuessGame),
  { ssr: false },
);
