// src/components/common/Sidebar.jsx
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { Link, useLocation } from "react-router-dom";

const DRAWER_WIDTH = 240;

/**
 * Shared sidebar for all three portals.
 *
 * Props:
 *  - items : array of { label, path, icon? } — each portal passes its own
 *            nav list. icon is an optional React node (MUI icon).
 *
 * Active-route highlighting comes from useLocation, so the sidebar itself
 * knows which item to light up — no prop needed for that.
 */
export default function Sidebar({ items }) {
  const location = useLocation();

  // A nav item is "active" if the current URL starts with its path.
  // startsWith (not ===) so that /admin/students/add and
  // /admin/students/123 still highlight the "Students" item.
  const isActive = (path) => location.pathname.startsWith(path);

  return (
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
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            component={Link}
            to={item.path}
            selected={isActive(item.path)}
            sx={{
              // Left accent bar on the active item
              "&.Mui-selected": {
                borderLeft: 3,
                borderColor: "primary.main",
                bgcolor: "action.selected",
              },
            }}
          >
            {item.icon && (
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            )}
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
