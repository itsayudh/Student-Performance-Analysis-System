// src/layouts/AuthLayout.jsx
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

export default function AuthLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Left branding panel — hidden on mobile per spec */}
      {!isMobile && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            p: 6,
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            SPAS
          </Typography>
          <Typography
            variant="h6"
            sx={{ opacity: 0.9, textAlign: "center", maxWidth: 400 }}
          >
            Student Performance Analysis System
          </Typography>
          {/* TODO: swap this text block for an illustration/SVG once design assets exist */}
        </Box>
      )}

      {/* Right form panel — becomes the only visible panel on mobile */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: isMobile ? 2 : 6,
        }}
      >
        <Paper
          elevation={isMobile ? 0 : 3}
          sx={{
            width: "100%",
            maxWidth: 420,
            p: 4,
            borderRadius: 2,
          }}
        >
          {/* Each auth page (Login, ForgotPassword, ResetPassword) renders here */}
          <Outlet />
        </Paper>
      </Box>
    </Box>
  );
}
