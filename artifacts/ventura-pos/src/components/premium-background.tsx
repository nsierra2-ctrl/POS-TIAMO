interface PremiumBackgroundProps {
  variant?: "default" | "food";
}

export function PremiumBackground({ variant = "default" }: PremiumBackgroundProps) {
  const isFood = variant === "food";

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Base */}
      <div className="absolute inset-0" style={{ background: "#070708" }} />

      {/* 4K cinematic food gradient (login only) */}
      {isFood && (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 30% 20%, rgba(255,90,40,0.16) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 75% 75%, rgba(255,170,30,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,45,45,0.08) 0%, transparent 70%)",
              animation: "food-pan 24s ease-in-out infinite",
            }}
          />
          {/* Floating particles */}
          <div className="particles">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  left: `${(i * 4.17) % 100}%`,
                  animationDelay: `${(i * 0.7) % 14}s`,
                  animationDuration: `${14 + (i % 5) * 2}s`,
                  background:
                    i % 3 === 0
                      ? "rgba(255,170,30,0.55)"
                      : i % 3 === 1
                        ? "rgba(255,90,40,0.45)"
                        : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
          {/* Steam effect */}
          <div
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{
              background:
                "radial-gradient(ellipse at center bottom, rgba(255,255,255,0.04) 0%, transparent 60%)",
              animation: "steam-rise 12s ease-in-out infinite",
            }}
          />
        </>
      )}

      {/* Animated orb 1 — red accent top-left */}
      <div
        className="absolute rounded-full"
        style={{
          width: "55vw",
          height: "55vw",
          top: "-15vw",
          left: "-10vw",
          background:
            "radial-gradient(circle at center, rgba(255,45,45,0.13) 0%, rgba(200,0,0,0.06) 40%, transparent 70%)",
          animation: "orb-float-1 22s ease-in-out infinite",
          filter: "blur(2px)",
        }}
      />

      {/* Animated orb 2 — purple bottom-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vw",
          bottom: "-20vw",
          right: "-15vw",
          background:
            "radial-gradient(circle at center, rgba(139,92,246,0.09) 0%, rgba(100,60,200,0.04) 45%, transparent 70%)",
          animation: "orb-float-2 28s ease-in-out infinite",
          filter: "blur(2px)",
        }}
      />

      {/* Animated orb 3 — amber center */}
      <div
        className="absolute rounded-full"
        style={{
          width: "40vw",
          height: "40vw",
          top: "30%",
          left: "40%",
          background:
            "radial-gradient(circle at center, rgba(245,158,11,0.05) 0%, transparent 60%)",
          animation: "orb-float-3 18s ease-in-out infinite",
          filter: "blur(4px)",
        }}
      />

      {/* Animated orb 4 — subtle blue top-right */}
      <div
        className="absolute rounded-full"
        style={{
          width: "35vw",
          height: "35vw",
          top: "-5vw",
          right: "10vw",
          background:
            "radial-gradient(circle at center, rgba(59,130,246,0.06) 0%, transparent 65%)",
          animation: "orb-float-4 32s ease-in-out infinite",
          filter: "blur(3px)",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "grid-fade 8s ease-in-out infinite",
        }}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Top edge glow */}
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,45,45,0.25) 30%, rgba(255,100,100,0.3) 50%, rgba(255,45,45,0.25) 70%, transparent 100%)",
        }}
      />
    </div>
  );
}
