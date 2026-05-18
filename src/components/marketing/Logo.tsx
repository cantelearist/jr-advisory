import React from "react";

export function Logo() {
  return (
    <a
      href="#"
      style={{ display: "inline-flex", alignItems: "stretch", gap: 14 }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          border: "1px solid currentColor",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 300,
          letterSpacing: ".04em",
          fontSize: 13,
        }}
      >
        JR
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        <div
          className="display"
          style={{ fontSize: 17, letterSpacing: ".22em" }}
        >
          JAMES ROMAN
        </div>
        <div
          className="mono"
          style={{ marginTop: 5, fontSize: 11, letterSpacing: ".34em", opacity: 0.55 }}
        >
          Advisory
        </div>
      </div>
    </a>
  );
}
