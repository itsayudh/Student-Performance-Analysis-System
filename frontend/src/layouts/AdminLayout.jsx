// src/layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import ClassIcon from "@mui/icons-material/Class";
import InsightsIcon from "@mui/icons-material/Insights";
import OnlinePredictionIcon from "@mui/icons-material/OnlinePrediction";
import AssessmentIcon from "@mui/icons-material/Assessment";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
  { label: "Students", path: "/admin/students", icon: <GroupsIcon /> },
  { label: "Teachers", path: "/admin/teachers", icon: <SchoolIcon /> },
  { label: "Classes", path: "/admin/classes", icon: <ClassIcon /> },
  { label: "Analytics", path: "/admin/analytics", icon: <InsightsIcon /> },
  {
    label: "Predictions",
    path: "/admin/predictions",
    icon: <OnlinePredictionIcon />,
  },
  { label: "Reports", path: "/admin/reports", icon: <AssessmentIcon /> },
];

export default function AdminLayout() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Navbar title="SPAS — Admin Portal" />
      <Sidebar items={NAV_ITEMS} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* spacer below fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}
