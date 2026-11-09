import DashboardHeader from "../components/DashboardHeader";
import { useState, useEffect } from "react";
import PickupCoordinationModal from "../donor-dashboard/PickupCoordinationModal";
import "./DonorPastListings.css";
import "../index.css";
import "../App.css";
import "../CDashboard.css";

import searchIcon from "../assets/magnifying-glass.png";
import { apiFetch } from "../api";

function DonorPastListings() {
  const [listings, setListings] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectFiltering, setSelectedListings] = useState("all");

  const [activeReview, setActiveReview] = useState(null);
  const [activeCoordinationFood, setActiveCoordinationFood] = useState(null);
  const [activeCoordinationFoodId, setActiveCoordinationFoodId] = useState(null);

  const fetchListings = () => {
    apiFetch("/api/food/mine")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setListings)
      .catch(() => setLoadError("Could not load your listings."));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSelectNotification = (notification) => {
    if (notification.foodId) {
      const match = listings.find((l) => l.id === notification.foodId);
      if (match) {
        setActiveCoordinationFood(match);
        setActiveCoordinationFoodId(null);
      } else {
        setActiveCoordinationFood(null);
        setActiveCoordinationFoodId(notification.foodId);
      }
    }
  };

  const handleStatusUpdated = (updated) => {
    setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setActiveCoordinationFood(updated);
  };

  const filteredListings = listings.filter((listing) => {
    const matchesStatus =
      selectFiltering === "all" ||
      listing.status?.toLowerCase() === selectFiltering.toLowerCase();

    const matchesSearch =
      (listing.foodItem?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (listing.recipientName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="orders-page">
      <DashboardHeader role="donor" onDonorNotification={handleSelectNotification} />

      <main className="orders-container">
        <div className="orders-header-bar">
          <h1 className="orders-title">Past Listings</h1>

          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search listings or recipients..."
              className="orders-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <img src={searchIcon} alt="search" className="search-icon" />
          </div>
        </div>

        <div className="filter-row">
          {["all", "active", "claimed", "scheduled", "completed", "expired", "cancelled"].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-button ${selectFiltering === status ? "active" : ""}`}
              onClick={() => setSelectedListings(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="orders-table">
          <div className="orders-header-row">
            <span>Food Item</span>
            <span>Recipient</span>
            <span>Pickup Schedule</span>
            <span>Status</span>
            <span>Review</span>
          </div>

          {loadError ? (
            <p className="no-orders error-msg">{loadError}</p>
          ) : filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <div className="orders-row" key={listing.id}>
                <div className="col-cell col-food">
                  <span className="food-name">{listing.foodItem}</span>
                  {listing.tags && (
                    <span className="food-tag">{listing.tags.split(",")[0]}</span>
                  )}
                </div>

                <div className="col-cell col-recipient">
                  <span className="recipient-name">
                    {listing.recipientName || "Unclaimed"}
                  </span>
                </div>

                <div className="col-cell col-schedule">
                  <span className="schedule-date">
                    {listing.date
                      ? new Date(listing.date + "T00:00:00").toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span className="schedule-time">
                    {listing.pickupTime
                      ? new Date(listing.pickupTime).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "Time not set"}
                  </span>
                </div>

                <div className="col-cell col-status">
                  <span className={`status-pill status-${listing.status?.toLowerCase()}`}>
                    {listing.status || "ACTIVE"}
                  </span>
                </div>

                <div className="col-cell col-feedback">
                  {listing.reviewRating ? (
                    <button
                      className="view-review-btn"
                      type="button"
                      onClick={() =>
                        setActiveReview({
                          foodTitle: listing.foodItem,
                          reviewer: listing.recipientName || "Recipient",
                          rating: listing.reviewRating,
                          comment: listing.reviewComment || "No written feedback provided.",
                        })
                      }
                    >
                      ★ {listing.reviewRating}/5 View
                    </button>
                  ) : (
                    <span className="no-review-label">—</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-orders">No listings matching your search or filter.</p>
          )}
        </div>
      </main>

      {activeReview && (
        <div className="modal-overlay" onClick={() => setActiveReview(null)}>
          <div className="donor-review-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Review for {activeReview.foodTitle}</h3>
            <p className="modal-field">
              <strong>From:</strong> {activeReview.reviewer}
            </p>
            <div className="modal-stars">
              {"★".repeat(activeReview.rating || 0)}
              {"☆".repeat(Math.max(0, 5 - (activeReview.rating || 0)))}
              <span className="rating-number">({activeReview.rating}/5)</span>
            </div>
            <div className="modal-comment-box">
              <strong style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                RECIPIENT COMMENT
              </strong>
              <p className="modal-comment-text">"{activeReview.comment}"</p>
            </div>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveReview(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {(activeCoordinationFood || activeCoordinationFoodId) && (
        <PickupCoordinationModal
          food={activeCoordinationFood}
          foodId={activeCoordinationFoodId}
          onClose={() => {
            setActiveCoordinationFood(null);
            setActiveCoordinationFoodId(null);
          }}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}

export default DonorPastListings;