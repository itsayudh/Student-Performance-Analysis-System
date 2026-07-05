// src/routes/RoleRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

// Maps a role to its home dashboard, so a misrouted user lands somewhere useful
const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
};

export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuthContext();

  // Assumes ProtectedRoute already ran above this in the route tree,
  // so we know the user is authenticated by the time we get here.
  if (!allowedRoles.includes(role)) {
    const fallback = ROLE_HOME[role] || "/login";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
