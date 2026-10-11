import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Verify that an authenticated user exists and has the ADMIN role
  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return children;
}

export default AdminProtectedRoute;
