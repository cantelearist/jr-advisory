import React from "react";
import Image from "next/image";
import Link from "next/link";

export function Logo({ height = 38 }: { height?: number }) {
  const aspectRatio = 739 / 305; // original logo dimensions
  const width = Math.round(height * aspectRatio);

  return (
    <Link
      href="/"
      style={{ display: "inline-flex", alignItems: "center" }}
      aria-label="James Roman Advisory — Home"
    >
      <Image
        src="/images/logo.png"
        alt="James Roman Advisory"
        width={width}
        height={height}
        priority
        style={{
          height,
          width: "auto",
          objectFit: "contain",
        }}
      />
    </Link>
  );
}
