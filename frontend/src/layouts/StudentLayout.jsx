// src/layouts/StudentLayout.jsx
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GradingIcon from "@mui/icons-material/Grading";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/student/dashboard", icon: <DashboardIcon /> },
  {
    label: "My Attendance",
    path: "/student/attendance",
    icon: <EventAvailableIcon />,
  },
  { label: "My Marks", path: "/student/marks", icon: <GradingIcon /> },
  {
    label: "My Performance",
    path: "/student/performance",
    icon: <QueryStatsIcon />,
  },
  {
    label: "Recommendations",
    path: "/student/recommendations",
    icon: <TipsAndUpdatesIcon />,
  },
];

export default function StudentLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Navbar title="SPAS — Student Portal" />
      <Sidebar items={NAV_ITEMS} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
