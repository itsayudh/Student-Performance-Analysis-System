// src/components/common/Navbar.jsx
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LockResetIcon from "@mui/icons-material/LockReset";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useThemeToggle } from "../../contexts/ThemeContext";
import { color, font } from "../../theme/tokens";
import useAuth from "../../hooks/useAuth";
import api from "../../services/api";

/**
 * Shared top bar for all three portals.
 *
 * Props:
 *  - title : portal name, e.g. "Admin Portal"
 *  - accent: role accent color (GRIDLINE shell)
 *
 * Everything else (user identity, logout, theme mode) comes from context,
 * because it's identical across portals — only the title differs.
 */
export default function Navbar({ title, accent = color.ultramarine }) {
  const { user } = useAuthContext();
  const { logoutUser } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();
  const navigate = useNavigate();

  // anchorEl pattern: MUI menus attach to the element that opened them
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // ── Add Admin dialog (admin-only) ──
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminResult, setAdminResult] = useState(null); // { severity, message }

  const handleLogout = () => {
    setAnchorEl(null);
    logoutUser(); // POST /auth/logout + clear state + navigate — all in the hook
  };

  const handleCreateAdmin = () => {
    setCreatingAdmin(true);
    setAdminResult(null);

    api
      .post("/auth/admins", { email: adminEmail.trim() })
      .then((res) => {
        // Temp password is shown ONCE, here — same one-time-display
        // contract as student/teacher creation.
        setAdminResult({
          severity: "success",
          message: `Admin created. Temporary password (copy exactly, without quotes): "${res.data.temp_password}"`,
        });
        setAdminEmail("");
      })
      .catch((err) => {
        const detail = err.response?.data?.detail;
        setAdminResult({
          severity: "error",
          message: typeof detail === "string" ? detail : "Could not create admin.",
        });
      })
      .finally(() => setCreatingAdmin(false));
  };

  // First letter of email for the avatar circle, e.g. "a" for admin@...
  const avatarLetter = (user?.full_name || user?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // GRIDLINE shell: paper bar with the portal's axis line beneath —
        // role accent as a rule, not a slab.
        backgroundColor: "background.paper",
        color: "text.primary",
        borderBottom: `2px solid ${accent}`,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h6"
          noWrap
          sx={{ fontFamily: font.display, fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          SPAS
          <Box
            component="span"
            sx={{
              fontFamily: font.mono,
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: "text.secondary",
              ml: 1.5,
            }}
          >
            {title}
          </Box>
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Theme toggle */}
          <Tooltip title={mode === "light" ? "Dark mode" : "Light mode"}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* User menu */}
          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: accent }}>
                {avatarLetter}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={() => setAnchorEl(null)}
          >
            {/* Identity header — not clickable */}
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2">
                {user?.full_name || "User"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />

            {/* Add Admin — visible only to admins. The MENU guard is UX;
                the real security wall is require_role("ADMIN") on the
                backend route. Hiding a button protects nobody. */}
            {user?.role === "ADMIN" && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setAdminResult(null);
                  setAdminEmail("");
                  setAddAdminOpen(true);
                }}
              >
                <ListItemIcon>
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                Add Admin
              </MenuItem>
            )}

            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate("/change-password");
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change Password
            </MenuItem>

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>

      {/* ── Add Admin dialog ── */}
      <Dialog
        open={addAdminOpen}
        onClose={creatingAdmin ? undefined : () => setAddAdminOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Admin</DialogTitle>``
        <DialogContent>
          {adminResult && (
            <Alert severity={adminResult.severity} sx={{ mb: 2 }}>
              {adminResult.message}
            </Alert>
          )}
          <TextField
            fullWidth
            size="small"
            label="Email *"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setAddAdminOpen(false)}
            disabled={creatingAdmin}
            color="inherit"
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateAdmin}
            disabled={creatingAdmin || !adminEmail.includes("@")}
          >
            {creatingAdmin ? "Creating..." : "Create Admin"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}