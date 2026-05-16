import React from "react";

interface PlateProps {
  tag?: string;
  label?: string;
  h: string | number;
  style?: React.CSSProperties;
  drift?: boolean;
}

export function Plate({ tag, label, h, style, drift = false }: PlateProps) {
  return (
    <div className="plate mask-reveal" style={{ height: h, ...style }}>
      <div
        className={`plate-inner${drift ? " drift" : ""}`}
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(60% 80% at 30% 20%, rgba(255,255,255,0.04), transparent 70%)",
            "radial-gradient(80% 60% at 80% 90%, rgba(201,181,138,0.07), transparent 70%)",
            "linear-gradient(180deg, #14181f, #0a0c10)",
          ].join(","),
        }}
      />
      {tag && <div className="plate-tag">{tag}</div>}
      {label && <div className="plate-label">{label}</div>}
    </div>
  );
}
