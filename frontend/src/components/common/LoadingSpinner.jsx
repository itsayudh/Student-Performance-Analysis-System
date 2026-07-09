// src/components/common/LoadingSpinner.jsx
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

/**
 * Reusable loading indicator.
 *
 * Two modes:
 *  - fullPage (default): fills the viewport height — used while the app
 *    is deciding auth state (ProtectedRoute) or a whole page is loading.
 *  - inline (fullPage={false}): small spinner for inside cards/tables,
 *    e.g. DataTable re-fetching, a StatCard waiting for analytics data.
 *
 * Props:
 *  - fullPage : boolean (default true)
 *  - message  : optional text under the spinner ("Loading students...")
 *  - size     : spinner diameter in px (default 40)
 */
export default function LoadingSpinner({
  fullPage = true,
  message = "",
  size = 40,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        ...(fullPage
          ? { minHeight: "60vh", width: "100%" }
          : { py: 3, width: "100%" }),
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
