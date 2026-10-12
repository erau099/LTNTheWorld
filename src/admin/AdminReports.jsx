import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/admin/reports");

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        setReports(data);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError("Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        <section className="admin-welcome">
          <h1>All Reports</h1>
          <p>View reports submitted by users across the platform.</p>
        </section>

        {loading && <p>Loading reports...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && reports.length === 0 && (
          <p>No reports found.</p>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="admin-user-table">
            <div className="admin-user-row admin-user-table-header">
              <span>Type</span>
              <span>Reason</span>
              <span>Description</span>
              <span>Status</span>
              <span>Created</span>
            </div>

            {reports.map((report) => (
              <div className="admin-user-row" key={report.id}>
                <span>{report.reportType}</span>
                <span>{report.reason}</span>
                <span>{report.description || "None"}</span>
                <span>{report.status}</span>
                <span>
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminReports;