// src/layouts/AdminLayout.jsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuthContext } from "../contexts/AuthContext";

// TODO: friend replaces this with components/common/Sidebar.jsx once built
// TODO: friend replaces topbar with components/common/Navbar.jsx once built
const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Students", path: "/admin/students" },
  { label: "Teachers", path: "/admin/teachers" },
  { label: "Classes", path: "/admin/classes" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Predictions", path: "/admin/predictions" },
  { label: "Reports", path: "/admin/reports" },
];

export default function AdminLayout() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Top bar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">SPAS — Admin Portal</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">{user?.email}</Typography>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar /> {/* spacer to push list below the fixed AppBar */}
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton key={item.path} component={Link} to={item.path}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Page content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* spacer to push content below the fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}
