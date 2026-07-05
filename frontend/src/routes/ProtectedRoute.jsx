// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    // Silent refresh-token check (in authService, wired later) is still running.
    // Avoid flashing a redirect to /login before we know the real auth state.
    return <div>Loading...</div>; // TODO: swap for components/common/LoadingSpinner.jsx once built
  }

  if (!isAuthenticated) {
    // Preserve the attempted location so login can redirect back after success
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
