import DashboardHeader from "../components/DashboardHeader";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import PickupCoordinationModal from "./PickupCoordinationModal";

import "../index.css";
import "../App.css";
import "../CDashboard.css";
import "./DonorDashboard.css";

function formatPickup(item) {
  const time = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const date = new Date(item.date + "T00:00:00").toLocaleDateString();
  return `Pick up ${date} @ ${time(item.pickupTime)} - ${time(item.pickupEndTime)}`;
}

function DonorDashboard() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");

  const [activeCoordinationFood, setActiveCoordinationFood] = useState(null);
  const [activeCoordinationFoodId, setActiveCoordinationFoodId] = useState(null);

  useEffect(() => {
    apiFetch("/api/food/mine")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setListings)
      .catch(() => setLoadError("Could not load your listings."));
  }, []);

  const visibleListings = listings.filter((item) => {
    if (filter === "all") return true;
    const s = (item.status || "").toLowerCase();
    return s === filter.toLowerCase();
  });

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

  return (
    <div className="donor-dashboard">
      <DashboardHeader role="donor" onDonorNotification={handleSelectNotification} />

      <main className="donor-main">
        <h2>Your Listings</h2>
        {loadError && <p className="error-msg">{loadError}</p>}

        <div className="filter-row">
          {["all", "active", "claimed", "scheduled", "completed", "expired"].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-button ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="donor-content-row">
          {visibleListings.length === 0 ? (
            <p style={{ margin: "20px 0", color: "#666" }}>
              No {filter === "all" ? "" : filter} listings found.
            </p>
          ) : (
            visibleListings.map((item) => (
              <div
                key={item.id}
                className="donor-food-card"
                onClick={() => {
                  setActiveCoordinationFood(item);
                  setActiveCoordinationFoodId(null);
                }}
                style={{ cursor: "pointer" }}
                title="Click to manage listing and pickup"
              >
                <div
                  className="donor-food-image"
                  style={
                    item.photos?.length
                      ? {
                          backgroundImage: `url(${item.photos[0]})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <span className="category-tag">{item.tags?.split(",")[0]}</span>
                </div>

                <div className="donor-food-info">
                  <div>
                    <p className="food-title">{item.foodItem}</p>
                    <p className="pickup-time">{formatPickup(item)}</p>
                  </div>

                  <span className={`status-pill status-${(item.status || "active").toLowerCase()}`}>
                    {item.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            ))
          )}

          <button
            className="add-listing-button"
            onClick={() => navigate("/UploadFoodDetails")}
            title="Add new listing"
            type="button"
          >
            +
          </button>
        </div>
      </main>

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

export default DonorDashboard;