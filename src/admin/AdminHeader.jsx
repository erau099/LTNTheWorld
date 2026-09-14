import { useNavigate } from "react-router-dom";
import "../index.css";

function AdminHeader() {
  const navigate = useNavigate();

    const handleHome = () => {
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


        <button className="gear_btn"
          onClick={() => navigate("/admin-settings")}>
          ⚙
        </button>
      </div>
    </nav>
  );
}

export default AdminHeader;