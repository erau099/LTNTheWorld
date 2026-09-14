import "../index.css";

function AdminHeader() {
  return (
    <nav className="nav">
      <span className="header_title">Admin Dashboard</span>

      <div className="header_links">
        <button className="headerbtn">
          Dashboard
        </button>

        <button className="headerbtn">
          User Management
        </button>

        <button className="gear_btn">
          ⚙
        </button>
      </div>
    </nav>
  );
}

export default AdminHeader;