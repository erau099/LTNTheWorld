
import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [negativeReviews, setNegativeReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchModerationData = async () => {
      try {
        setLoading(true);
        setError("");

        // DT-50: Fetch existing reports and low-rated reviews.
        const [reportsResponse, reviewsResponse] = await Promise.all([
          fetch("/api/admin/reports"),
          fetch("/api/admin/reviews/negative"),
        ]);

        if (!reportsResponse.ok) {
          throw new Error(
            `Failed to load reports: HTTP ${reportsResponse.status}`
          );
        }

        if (!reviewsResponse.ok) {
          throw new Error(
            `Failed to load negative reviews: HTTP ${reviewsResponse.status}`
          );
        }

        const [reportsData, reviewsData] = await Promise.all([
          reportsResponse.json(),
          reviewsResponse.json(),
        ]);

        setReports(reportsData);
        setNegativeReviews(reviewsData);
      } catch (err) {
        console.error("Failed to load moderation information:", err);
        setError("Unable to load reports and negative reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchModerationData();
  }, []);

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "N/A";

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        <section className="admin-welcome">
          <h1>Reports and Negative Reviews</h1>
          <p>
            Review submitted reports and low-rated feedback to identify
            potentially inappropriate activity.
          </p>
        </section>

        {loading && <p>Loading moderation information...</p>}

        {error && <p role="alert">{error}</p>}

        {!loading && !error && (
          <>
            {/* Existing reports section */}
            <section className="admin-user-management">
              <div className="admin-section-header">
                <div>
                  <h2>Submitted Reports</h2>
                  <p>Review reports submitted by users across the platform.</p>
                </div>
              </div>

              {reports.length === 0 ? (
                <p>No reports found.</p>
              ) : (
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
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* DT-50: Negative reviews section */}
            <section className="admin-user-management">
              <div className="admin-section-header">
                <div>
                  <h2>Negative Reviews</h2>
                  <p>
                    Reviews rated 1 or 2 stars are displayed for
                    administrator review. A low rating alone does not
                    establish misconduct.
                  </p>
                </div>
              </div>

              {negativeReviews.length === 0 ? (
                <p>No negative reviews found.</p>
              ) : (
                <div className="admin-user-table">
                  <div style={{ overflowX: "auto", width: "100%" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        textAlign: "left",
                      }}
                    >
                      <thead>
                        <tr>
                          <th scope="col">Food Listing</th>
                          <th scope="col">Rating</th>
                          <th scope="col">Comment</th>
                          <th scope="col">Listing Owner ID</th>
                          <th scope="col">Created</th>
                        </tr>
                      </thead>

                      <tbody>
                        {negativeReviews.map((review) => (
                          <tr key={review.id}>
                            <td>{review.foodItem || "Unknown listing"}</td>
                            <td>{review.rating}/5</td>
                            <td>{review.comment || "No comment"}</td>
                            <td style={{ wordBreak: "break-all" }}>
                              {review.listingOwnerId || "N/A"}
                            </td>
                            <td>{formatDate(review.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminReports;
