"use client";

import React, { useState, useEffect } from "react";

const STORAGE_KEY = "jr_cookie_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // localStorage unavailable
    }
    const tm = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(tm);
  }, []);

  const accept = (val: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, val);
    } catch {
      // localStorage unavailable
    }
    setVisible(false);
  };

  return (
    <div
      className={`cookie-banner${visible ? " show" : ""}`}
      role="dialog"
      aria-label="Privacy preferences"
      data-testid="cookie-banner"
    >
      <div
        className="mono"
        style={{
          marginBottom: 10,
          fontSize: 10,
          letterSpacing: ".22em",
          color: "var(--fg)",
        }}
      >
        A NOTE ON PRIVACY.
      </div>
      <p
        className="small-copy"
        style={{ fontSize: 12, marginBottom: 16 }}
      >
        We use a single, essential cookie to remember this preference. No
        analytics, advertising, or third-party trackers are loaded unless you
        accept. As a California resident, you may{" "}
        <a
          href="#"
          style={{ borderBottom: "1px solid rgba(236,230,214,.2)" }}
        >
          opt out of any sharing
        </a>{" "}
        at any time.
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => accept("accepted")}
          className="btn"
          style={{
            padding: "8px 16px",
            fontSize: 10,
            background: "var(--fg)",
            color: "var(--bg)",
            borderColor: "var(--fg)",
          }}
        >
          Accept All
        </button>
        <button
          onClick={() => accept("essential")}
          className="btn"
          style={{ padding: "8px 16px", fontSize: 10 }}
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
