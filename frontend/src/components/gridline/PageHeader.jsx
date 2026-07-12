import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Page header enforcing the layout rule: title left, ONE primary action
// top-right. Pages pass their action as `action` — never place primary
// buttons anywhere else on a page.
export default function PageHeader({ title, action = null }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
      <Typography variant="h4">{title}</Typography>
      {action}
    </Box>
  );
}