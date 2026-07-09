// src/layouts/TeacherLayout.jsx
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ClassIcon from "@mui/icons-material/Class";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import GradingIcon from "@mui/icons-material/Grading";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/teacher/dashboard", icon: <DashboardIcon /> },
  { label: "My Classes", path: "/teacher/classes", icon: <ClassIcon /> },
  {
    label: "Attendance",
    path: "/teacher/attendance",
    icon: <EventAvailableIcon />,
  },
  { label: "Marks", path: "/teacher/marks", icon: <GradingIcon /> },
  {
    label: "Student Performance",
    path: "/teacher/performance",
    icon: <QueryStatsIcon />,
  },
  {
    label: "Early Warning",
    path: "/teacher/early-warning",
    icon: <WarningAmberIcon />,
  },
];

export default function TeacherLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Navbar title="SPAS — Teacher Portal" />
      <Sidebar items={NAV_ITEMS} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
