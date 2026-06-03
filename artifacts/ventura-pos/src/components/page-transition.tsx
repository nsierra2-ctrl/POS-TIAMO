import { useLocation } from "wouter";
import { ReactNode, useEffect, useRef, useState } from "react";

interface PageTransitionProps {
  children: (location: string) => ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [stage, setStage] = useState<"enter" | "exit">("enter");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    if (location !== displayLocation) {
      setStage("exit");
      const t = setTimeout(() => {
        setDisplayLocation(location);
        setStage("enter");
      }, 180);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location, displayLocation]);

  return (
    <div
      key={displayLocation}
      className={stage === "enter" ? "page-enter" : "page-exit"}
      style={{ minHeight: "100vh" }}
    >
      {children(displayLocation)}
    </div>
  );
}
