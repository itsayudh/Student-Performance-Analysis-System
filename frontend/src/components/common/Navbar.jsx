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
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useThemeToggle } from "../../contexts/ThemeContext";
import { color, font } from "../../theme/tokens";
import useAuth from "../../hooks/useAuth";

/**
 * Shared top bar for all three portals.
 *
 * Props:
 *  - title : portal name, e.g. "SPAS — Admin Portal"
 *
 * Everything else (user identity, logout, theme mode) comes from context,
 * because it's identical across portals — only the title differs.
 */
export default function Navbar({ title, accent = color.ultramarine }) {
  const { user, logout } = useAuthContext();
export default function Navbar({ title }) {
  const { user } = useAuthContext();
  const { logoutUser } = useAuth();
  const { mode, toggleTheme } = useThemeToggle();
  const navigate = useNavigate();

  // anchorEl pattern: MUI menus attach to the element that opened them
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);



const handleLogout = () => {
  setAnchorEl(null);
  logoutUser(); // POST /auth/logout + clear state + navigate — all in the hook
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
         <Typography variant="h6" noWrap sx={{ fontFamily: font.display, fontWeight: 700, letterSpacing: "-0.01em" }}>
          SPAS
          <Box component="span" sx={{ fontFamily: font.mono, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", color: "text.secondary", ml: 1.5 }}>
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
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
