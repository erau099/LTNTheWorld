import DashboardHeader from "../components/DashboardHeader";
import { useState, useEffect } from "react";
import "./RecipientPastOrders.css";
import "../index.css";
import "../App.css";
import "../CDashboard.css";
import ReviewModal from "../ReviewModal.jsx";
import searchIcon from "../assets/magnifying-glass.png";

function formatTimeDisplay(timeStr) {
  if (!timeStr) return "N/A";

  if (timeStr.includes("T") || !isNaN(Date.parse(timeStr))) {
    return new Date(timeStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  }

  return timeStr;
}

function RecipientPastOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviewOrder, setReviewOrder] = useState(null);
  const [viewReview, setViewReview] = useState(null);

  const [selectFiltering, setSelectedOrders] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/recipient/orders", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response || !response.ok) {
        throw new Error(response ? `Failed to load orders: HTTP ${response.status}` : "Unable to reach server");
      }

      const data = await response.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError(err?.message || "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReviewSubmit = async ({ foodId, rating, comment }) => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          foodId: Number(foodId),
          rating: Number(rating),
          comment,
        }),
      });

      if (!response || !response.ok) {
        const message = response ? await response.text() : "Network error";
        throw new Error(message || `HTTP ${response?.status}`);
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.foodId === foodId || order.id === foodId
            ? { ...order, reviewed: true, reviewRating: rating, reviewComment: comment }
            : order
        )
      );

      alert("Review submitted successfully!");
      setReviewOrder(null);
    } catch (err) {
      console.error("Failed to submit review:", err);
      alert("Could not submit review. Check console for details.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectFiltering === "all" ||
      order.status?.toLowerCase() === selectFiltering.toLowerCase() ||
      (selectFiltering === "claimed" && order.status?.toLowerCase() === "pending");

    const matchesSearch =
      (order.donor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (order.food?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="orders-page">
      <DashboardHeader role="recipient" />

      <main className="orders-container">
        <div className="orders-header-bar">
          <h1 className="orders-title">Past Orders</h1>

          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search orders or donors..."
              className="orders-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src={searchIcon} alt="search" className="search-icon" />
          </div>
        </div>

        <div className="filter-row">
          {[
            { key: "all", label: "All" },
            { key: "claimed", label: "Claimed" },
            { key: "scheduled", label: "Scheduled" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`filter-button ${selectFiltering === key ? "active" : ""}`}
              onClick={() => setSelectedOrders(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="orders-table">
          <div className="orders-header-row">
            <span>Food Item</span>
            <span>Donor</span>
            <span>Pickup Schedule</span>
            <span>Status</span>
            <span>Review</span>
          </div>

          {loading ? (
            <p className="no-orders">Loading orders...</p>
          ) : error ? (
            <p className="no-orders error-msg">{error}</p>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
              const directionsDestination = order.directionsUrl || (order.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}` : null);

              return (
                <div className="orders-row" key={order.id}>
                  <div className="col-cell col-food">
                    <span className="food-name">{order.food}</span>
                    {order.tags && (
                      <span className="food-tag">{order.tags.split(",")[0]}</span>
                    )}
                  </div>

                  <div className="col-cell col-recipient">
                    <span className="recipient-name">{order.donor || "Anonymous Donor"}</span>
                    {directionsDestination && (
                      <a
                        href={directionsDestination}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="directions-link"
                      >
                        📍 Directions
                      </a>
                    )}
                  </div>

                  <div className="col-cell col-schedule">
                    <span className="schedule-date">{order.date || "N/A"}</span>
                    <span className="schedule-time">{formatTimeDisplay(order.time)}</span>
                  </div>

                  <div className="col-cell col-status">
                    <span
                      className={`status-pill status-${(order.status || "claimed").toLowerCase()}`}
                    >
                      {order.status || "CLAIMED"}
                    </span>
                  </div>

                  <div className="col-cell col-feedback">
                    {order.reviewed ? (
                      <button
                        className="view-review-btn"
                        type="button"
                        onClick={() =>
                          setViewReview({
                            foodTitle: order.food,
                            donorName: order.donor,
                            rating: order.reviewRating,
                            comment: order.reviewComment || "No written feedback provided.",
                          })
                        }
                      >
                        ★ {order.reviewRating}/5 View
                      </button>
                    ) : order.status?.toLowerCase() === "completed" ? (
                      order.reviewEligible ? (
                        <button
                          className="submit-review-action-btn active"
                          type="button"
                          onClick={() => setReviewOrder(order)}
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          className="submit-review-action-btn disabled expired-review-btn"
                          type="button"
                          disabled
                          title={
                            order.reviewEligibilityMessage ||
                            "Review window expired (72-hour limit reached)"
                          }
                        >
                          Expired (&gt;72h)
                        </button>
                      )
                    ) : (
                      <button
                        className="submit-review-action-btn disabled"
                        type="button"
                        disabled
                        title="Reviews can only be submitted once pickup is completed"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-orders">No past orders found.</p>
          )}
        </div>
      </main>

      {reviewOrder && (
        <ReviewModal
          foodId={reviewOrder.foodId || reviewOrder.id}
          onClose={() => setReviewOrder(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {viewReview && (
        <div className="modal-overlay" onClick={() => setViewReview(null)}>
          <div className="donor-review-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Review for {viewReview.foodTitle}</h3>
            <p className="modal-field">
              <strong>Donor:</strong> {viewReview.donorName}
            </p>
            <div className="modal-stars">
              {"★".repeat(viewReview.rating || 0)}
              {"☆".repeat(Math.max(0, 5 - (viewReview.rating || 0)))}
              <span className="rating-number">({viewReview.rating}/5)</span>
            </div>
            <div className="modal-comment-box">
              <strong style={{ fontSize: "0.85rem", color: "#65756a" }}>
                YOUR FEEDBACK
              </strong>
              <p className="modal-comment-text">"{viewReview.comment}"</p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setViewReview(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipientPastOrders;