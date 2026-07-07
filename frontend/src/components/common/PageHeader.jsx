// src/components/common/PageHeader.jsx
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";

/**
 * Consistent header block at the top of every page.
 *
 * Props:
 *  - title       : main heading, e.g. "Students"
 *  - subtitle    : optional secondary line, e.g. "Manage all student records"
 *  - breadcrumbs : optional array of { label, to } — last item is
 *                  rendered as plain text (current page, not a link).
 *                  e.g. [
 *                    { label: "Dashboard", to: "/admin/dashboard" },
 *                    { label: "Students", to: "/admin/students" },
 *                    { label: "Ram Sharma" }        // current page, no `to`
 *                  ]
 *  - action      : optional React node rendered on the right side —
 *                  usually a Button like "+ Add Student"
 */
export default function PageHeader({ title, subtitle, breadcrumbs, action }) {
  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
          {breadcrumbs.map((crumb, i) =>
            crumb.to && i !== breadcrumbs.length - 1 ? (
              <MuiLink
                key={i}
                component={RouterLink}
                to={crumb.to}
                underline="hover"
                color="inherit"
                variant="body2"
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography key={i} variant="body2" color="text.primary">
                {crumb.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
}
