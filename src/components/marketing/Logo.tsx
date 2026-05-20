import React from "react";

export function Logo({ height = 38 }: { height?: number }) {
  const aspectRatio = 739 / 305; // original logo dimensions
  const width = Math.round(height * aspectRatio);

  return (
    <a
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
    </a>
  );
}
