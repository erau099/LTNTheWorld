import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return <div className="admin-loading">Verifying administrator session...</div>;
  }

  // Verify that an authenticated user exists and has the ADMIN role
  if (!user || String(user.role || "").toUpperCase() !== "ADMIN") {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminProtectedRoute;
