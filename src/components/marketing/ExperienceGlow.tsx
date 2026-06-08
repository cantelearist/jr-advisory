export function ExperienceGlow() {
  return (
    <div aria-hidden style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 10, opacity: 0.55, mixBlendMode: "screen" }}>
      <div className="experience-glow" />
    </div>
  );
}
