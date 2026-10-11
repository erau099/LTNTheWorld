import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../index.css";

function AdminHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleHome = () => {
    navigate("/");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="nav">
      <span className="header_title">Admin Dashboard</span>

      <div className="header_links">
        <button
          className="headerbtn"
          onClick={handleHome}
        >
          Home
        </button>

        <button className="headerbtn" 
        onClick={() => navigate("/admin-dashboard")}>
          Dashboard
        </button>

        {user && (
          <span style={{ color: "white", fontSize: "0.9rem", alignSelf: "center", marginRight: "10px" }}>
            Admin: {user.name || "Administrator"}
          </span>
        )}

        <button
          className="headerbtn"
          onClick={handleLogout}
          style={{ backgroundColor: "#d9534f", color: "white" }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}

export default AdminHeader;