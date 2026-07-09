// src/components/common/StatCard.jsx
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";

/**
 * Dashboard number tile: "Total Students: 248", "Avg Attendance: 87%", etc.
 *
 * Props:
 *  - title    : label, e.g. "Total Students"
 *  - value    : the number/string to display, e.g. 248 or "87%"
 *  - icon     : optional React node (an MUI icon), shown in a tinted circle
 *  - color    : MUI palette key for the icon tint — "primary" | "secondary"
 *               | "error" | "warning" | "success" | "info" (default "primary")
 *  - subtitle : optional small line under the value, e.g. "+12 this month"
 *  - loading  : shows skeleton placeholders while the API call is in flight
 */
export default function StatCard({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  loading = false,
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {title}
          </Typography>

          {loading ? (
            <Skeleton width={80} height={36} />
          ) : (
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
          )}

          {subtitle && !loading && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
