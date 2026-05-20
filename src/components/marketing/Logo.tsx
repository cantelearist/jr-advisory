import React from "react";
import Link from "next/link";

export function Logo({ height = 38 }: { height?: number }) {
  const aspectRatio = 739 / 305; // original logo dimensions
  const width = Math.round(height * aspectRatio);

  return (
    <Link
      href="/"
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      <img
        src="/images/logo.png"
        alt="James Roman Advisory"
        width={width}
        height={height}
        style={{
          height,
          width: "auto",
          objectFit: "contain",
        }}
      />
    </Link>
  );
}
