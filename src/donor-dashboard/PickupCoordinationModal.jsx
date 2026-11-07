import { useState, useEffect } from "react";
import "./PickupCoordinationModal.css";

function PickupCoordinationModal({ food, foodId, onClose, onStatusUpdated }) {
  const [listing, setListing] = useState(food || null);
  const [loading, setLoading] = useState(!food && !!foodId);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!listing && foodId) {
      setLoading(true);
      fetch(`/api/food/${foodId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load food details");
          return res.json();
        })
        .then((data) => setListing(data))
        .catch((err) => {
          console.error(err);
          setError("Could not load food listing details.");
        })
        .finally(() => setLoading(false));
    }
  }, [foodId, listing]);

  if (!food && !foodId) return null;

  const currentStatus = (listing?.status || "CLAIMED").toUpperCase();

  const handleConfirmPickup = async () => {
    if (!listing) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/food/${listing.id}/confirm-pickup`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to confirm pickup");
      }

      const updated = await res.json();
      setListing(updated);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to confirm pickup.");
    } finally {
      setActionLoading(false);
    }
  };

  // DT-76: decline the pending request and return the listing to ACTIVE.
  const handleDeclineRequest = async () => {
    if (!listing || actionLoading) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/food/${listing.id}/decline-request`, {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to decline request");
      }
      const updated = await res.json();
      setListing(updated);
      setSuccessMessage("Request declined. The recipient has been notified and the listing is available again.");
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (failure) {
      setError(failure.message || "Unable to decline request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompletePickup = async () => {
    if (!listing) return;
    setActionLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/food/${listing.id}/complete-pickup`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to complete pickup");
      }

      const updated = await res.json();
      setListing(updated);
      if (onStatusUpdated) onStatusUpdated(updated);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to complete pickup.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "Not specified";
    return timeStr.replace("T", " ").slice(0, 16);
  };

  return (
    <div className="pickup-modal-overlay" onClick={onClose}>
      <div className="pickup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pickup-modal-header">
          <h2>Pickup Coordination</h2>
          <button className="pickup-modal-close-btn" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        <div className="pickup-modal-body">
          {error && <div className="pickup-error-msg" role="alert">{error}</div>}
          {successMessage && <p className="pickup-success-msg" role="status">{successMessage}</p>}

          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading details...</p>
          ) : listing ? (
            <>
              <div className="pickup-food-hero">
                <div
                  className="pickup-food-thumb"
                  style={
                    listing.photos?.length
                      ? { backgroundImage: `url(${listing.photos[0]})` }
                      : undefined
                  }
                />
                <div className="pickup-food-meta">
                  <h3 className="pickup-food-title">{listing.foodItem}</h3>
                  <p className="pickup-food-desc">
                    {listing.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* Lifecycle Progress Tracker */}
              {currentStatus !== "ACTIVE" && <div className="pickup-status-tracker">
                <div
                  className={`tracker-step ${
                    ["CLAIMED", "SCHEDULED", "COMPLETED"].includes(currentStatus)
                      ? "completed"
                      : "active"
                  }`}
                >
                  <div className="tracker-dot">&#10003;</div>
                  <span className="tracker-label">Requested</span>
                </div>

                <div
                  className={`tracker-step ${
                    currentStatus === "SCHEDULED"
                      ? "active"
                      : currentStatus === "COMPLETED"
                      ? "completed"
                      : ""
                  }`}
                >
                  <div className="tracker-dot">
                    {currentStatus === "COMPLETED" ? "\u2713" : "2"}
                  </div>
                  <span className="tracker-label">Scheduled</span>
                </div>

                <div
                  className={`tracker-step ${
                    currentStatus === "COMPLETED" ? "completed active" : ""
                  }`}
                >
                  <div className="tracker-dot">
                    {currentStatus === "COMPLETED" ? "\u2713" : "3"}
                  </div>
                  <span className="tracker-label">Completed</span>
                </div>
              </div>}

              {/* Pickup Details */}
              <div className="pickup-details-list">
                <div className="pickup-detail-row">
                  <span className="pickup-detail-label">Current Status:</span>
                  <span className="pickup-detail-value">{currentStatus}</span>
                </div>
                <div className="pickup-detail-row">
                  <span className="pickup-detail-label">Pickup Address:</span>
                  <span className="pickup-detail-value">{listing.address || "Contact for pickup location"}</span>
                </div>
                <div className="pickup-detail-row">
                  <span className="pickup-detail-label">Pickup Window:</span>
                  <span className="pickup-detail-value">
                    {formatTime(listing.pickupTime)} &ndash; {listing.pickupEndTime ? formatTime(listing.pickupEndTime).slice(11) : "End time"}
                  </span>
                </div>
                <div className="pickup-detail-row">
                  <span className="pickup-detail-label">Categories:</span>
                  <span className="pickup-detail-value">{listing.tags || "General"}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pickup-modal-actions">
                <button
                  type="button"
                  className="pickup-action-btn pickup-btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>

                {currentStatus === "CLAIMED" && (
                  <button
                    type="button"
                    className="pickup-action-btn pickup-btn-decline"
                    onClick={handleDeclineRequest}
                    disabled={actionLoading}
                  >
                    Decline Request
                  </button>
                )}

                {currentStatus === "CLAIMED" && (
                  <button
                    type="button"
                    className="pickup-action-btn pickup-btn-primary"
                    onClick={handleConfirmPickup}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Confirming..." : "Confirm Pickup Schedule"}
                  </button>
                )}

                {currentStatus === "SCHEDULED" && (
                  <button
                    type="button"
                    className="pickup-action-btn pickup-btn-complete"
                    onClick={handleCompletePickup}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Saving..." : "Mark Pickup as Completed"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <p>Listing not found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PickupCoordinationModal;
