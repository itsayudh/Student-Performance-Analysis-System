import Paper from "@mui/material/Paper";

// The GRIDLINE panel: replaces every page-local cardSx object.
// Just themed Paper (flat, ruled — from the theme overrides) with the
// standard padding. One definition; change it here, change it everywhere.
export default function Panel({ children, sx = {}, ...props }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: "10px", height: "100%", ...sx }} {...props}>
      {children}
    </Paper>
  );
}