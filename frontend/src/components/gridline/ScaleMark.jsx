import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import { color, numSx } from "../../theme/tokens";
import { useTheme } from "@mui/material/styles";
// GRIDLINE's signature element: a micro-ruler placing a value on its
// native scale, so no number ever floats context-free.
//
// Props:
//  - value    : the number
//  - min, max : the scale (0-4 for GPA, 0-100 for percentages)
//  - zones    : optional [{ upTo, color }] — shaded bands, sorted ascending
//  - accent   : reserved for portal-tinted uses; needle defaults to ink
//  - height   : rule thickness
export default function ScaleMark({
  value,
  min = 0,
  max = 100,
  zones = null,
  accent = null,
  height = 6,
}) {
  
  const [settled, setSettled] = useState(false);
  const theme = useTheme();
  const needleColor = accent ?? theme.palette.text.primary;


  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSettled(true);
      return;
    }
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSettled(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const clamped = Math.min(max, Math.max(min, value));
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          position: "relative",
          height,
          borderRadius: 2,
          // overflow visible so the needle (taller than the track) is
          // never clipped; the bands are inset instead of relying on
          // the parent to crop them.
          backgroundColor: zones ? "transparent" : color.gridline,
        }}
      >
        {/* zone bands */}
        {zones &&
          zones.map((z, i) => {
            const from = i === 0 ? min : zones[i - 1].upTo;
            const left = ((from - min) / (max - min)) * 100;
            const width = ((z.upTo - from) / (max - min)) * 100;
            return (
              <Box
                key={i}
                sx={{
                  position: "absolute", top: 0, bottom: 0,
                  left: `${left}%`, width: `${width}%`,
                  backgroundColor: z.color, opacity: 0.55,
                  "&:first-of-type": { borderRadius: "4px 0 0 4px" },
                  "&:last-of-type": { borderRadius: "0 4px 4px 0" },
                }}
              />
            );
          })}
        {/* the needle — sits above the bands, extends past the track */}
        <Box
          sx={{
            position: "absolute",
            top: -2, bottom: -2,
            left: settled ? `calc(${pct}% - 1.5px)` : "-1.5px",
            width: 3,
            borderRadius: 1,
            backgroundColor: needleColor,
            zIndex: 1,
            transition: "left 400ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
        <Box component="span" sx={{ ...numSx, fontSize: 10, color: "text.display" }}>{min}</Box>
        <Box component="span" sx={{ ...numSx, fontSize: 10, color: "text.display" }}>{max}</Box>
      </Box>
    </Box>
  );
}

export const GPA_ZONES = [
  { upTo: 2.0, color: color.danger },
  { upTo: 2.8, color: color.warning },
  { upTo: 4.0, color: color.success },
];

export const PERCENT_ZONES = [
  { upTo: 40, color: color.danger },
  { upTo: 60, color: color.warning },
  { upTo: 100, color: color.success },
];