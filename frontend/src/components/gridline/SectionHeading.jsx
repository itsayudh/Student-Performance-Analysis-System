import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { color } from "../../theme/tokens";

// Section heading with the GRIDLINE axis tick: a short accent dash +
// hairline rule, encoding "a new measurement begins here".
export default function SectionHeading({ children, accent = color.ultramarine, sx = {} }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, ...sx }}>
      <Box sx={{ width: 3, height: 14, borderRadius: 1, backgroundColor: accent }} />
      <Typography variant="subtitle1">{children}</Typography>
      <Box sx={{ flex: 1, height: "1px", backgroundColor: "divider" }} />
    </Box>
  );
}