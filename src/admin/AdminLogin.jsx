import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === "success" && result.role === "ADMIN") {
          setUser({ name: result.name, role: result.role, username });
          setSuccessMessage("✅ Authenticated successfully! Redirecting to Admin Dashboard...");
          const destination = location.state?.from?.pathname || "/admin-dashboard";
          setTimeout(() => {
            navigate(destination, { replace: true });
          }, 800);
        } else {
          setErrorMessage("Access denied: Administrator privileges required.");
        }
      } else if (response.status === 403) {
        setErrorMessage("⛔ Access Denied: Administrator privileges required.");
      } else if (response.status === 401) {
        setErrorMessage("❌ Invalid username/email or password.");
      } else {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(errorData?.message || "❌ Login failed. Please verify credentials.");
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setErrorMessage("⚠️ Unable to reach server. Please ensure the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page">
      <nav className="admin-login-nav">
        <div className="admin-login-brand">
          <span>Love Thy Neighbor</span>
          <span className="admin-badge">Admin Portal</span>
        </div>
        <button
          className="admin-login-nav-btn"
          onClick={() => navigate("/")}
        >
          Return to Site
        </button>
      </nav>

      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-lock-icon">🔒</div>
            <h1>Administrator Login</h1>
            <p>Enter your administrative credentials to access management tools.</p>
          </div>

          {errorMessage && (
            <div className="admin-alert admin-alert-error" role="alert">
              <span>{errorMessage}</span>
              <button
                className="admin-alert-close"
                onClick={() => setErrorMessage("")}
                aria-label="Dismiss alert"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div className="admin-alert admin-alert-success" role="status">
              <span>{successMessage}</span>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleAdminLogin}>
            <div className="admin-input-group">
              <label htmlFor="admin-username">Admin Email / Username</label>
              <input
                id="admin-username"
                type="text"
                required
                placeholder="admin or admin@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="admin-input-group">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              className="admin-submit-btn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Authenticating..." : "Sign In to Admin Portal"}
            </button>
          </form>

          <div className="admin-footer-actions">
            <Link to="/" className="admin-cancel-link">
              ← Cancel and return to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
