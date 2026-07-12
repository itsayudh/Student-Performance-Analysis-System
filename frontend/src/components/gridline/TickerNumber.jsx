import { useState, useEffect, useRef } from "react";
import Typography from "@mui/material/Typography";
import { numSx } from "../../theme/tokens";

// Count-up display number: settles from 0 to value in ~400ms on mount.
// Opt-in — use ONLY on dashboard KPIs (the orchestrated moment), never
// on tables or lists. Respects prefers-reduced-motion.
// Props: value (number), format ((n) => string, e.g. formatGPA), variant
export default function TickerNumber({ value, format = (n) => String(n), variant = "h4", sx = {} }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef();

  useEffect(() => {
    if (value === null || value === undefined || Number.isNaN(value)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 400);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <Typography variant={variant} sx={{ ...numSx, ...sx }}>{format(display)}</Typography>;
}