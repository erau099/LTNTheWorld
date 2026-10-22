<<<<<<< HEAD
import { useState, useEffect } from "react";
=======

import { useState, useEffect, useCallback } from "react";
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03

function AdminFoodListings({ onListingCountChange }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);
  const [removalReason, setRemovalReason] = useState("");

<<<<<<< HEAD
  const fetchActiveListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/food/active");
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      setListings(data);
=======
  const fetchActiveListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/food/active");

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setListings(data);

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
      if (onListingCountChange) {
        onListingCountChange(data.length);
      }
    } catch (err) {
      console.error("Failed to fetch active food listings:", err);
<<<<<<< HEAD
      setError("Unable to load active food listings. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveListings();
  }, []);
=======
      setError(
        "Unable to load active food listings. Please ensure the backend server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [onListingCountChange]);

  useEffect(() => {
    fetchActiveListings();
  }, [fetchActiveListings]);
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03

  const handleRemoveClick = (listingId, foodTitle) => {
    setSelectedListing({
      id: listingId,
      title: foodTitle || "this item",
    });
    setRemovalReason("");
  };

  const handleCancelRemove = () => {
    setSelectedListing(null);
    setRemovalReason("");
  };

  const handleConfirmRemove = async () => {
<<<<<<< HEAD
    if (!removalReason.trim()) {
=======
    if (!selectedListing || !removalReason.trim()) {
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
      return;
    }

    setRemovingId(selectedListing.id);

    try {
<<<<<<< HEAD
      const response = await fetch(`/api/admin/food/${selectedListing.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REMOVED_BY_ADMIN",
          removalReason: removalReason.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to remove listing with HTTP ${response.status}`);
      }

      setListings((prev) => {
        const next = prev.filter((item) => item.id !== selectedListing.id);
        if (onListingCountChange) {
          onListingCountChange(next.length);
        }
=======
      const response = await fetch(
        `/api/admin/food/${selectedListing.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "REMOVED_BY_ADMIN",
            removalReason: removalReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to remove listing with HTTP ${response.status}`
        );
      }

      setListings((prev) => {
        const next = prev.filter(
          (item) => item.id !== selectedListing.id
        );

        if (onListingCountChange) {
          onListingCountChange(next.length);
        }

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        return next;
      });

      setSelectedListing(null);
      setRemovalReason("");
    } catch (err) {
      console.error("Error removing food listing:", err);
<<<<<<< HEAD
      alert("Failed to remove food listing. Please check backend connection.");
=======
      alert(
        "Failed to remove food listing. Please check backend connection."
      );
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
    } finally {
      setRemovingId(null);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery.trim()) return true;
<<<<<<< HEAD
    const query = searchQuery.toLowerCase().trim();
    const title = (item.foodItem || item.listingTitle || item.title || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const tags = (item.tags || item.tag || "").toLowerCase();
    return title.includes(query) || desc.includes(query) || tags.includes(query);
=======

    const query = searchQuery.toLowerCase().trim();
    const title = (
      item.foodItem ||
      item.listingTitle ||
      item.title ||
      ""
    ).toLowerCase();

    const desc = (item.description || "").toLowerCase();
    const tags = (
      item.tags ||
      item.tag ||
      ""
    ).toLowerCase();

    return (
      title.includes(query) ||
      desc.includes(query) ||
      tags.includes(query)
    );
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
  });

  return (
    <section className="admin-food-management">
      <div className="admin-section-header">
        <div>
          <h2>Active Food Listings</h2>
<<<<<<< HEAD
          <p>Monitor live food donations and moderate inappropriate or expired items.</p>
        </div>
=======
          <p>
            Monitor live food donations and moderate inappropriate or
            expired items.
          </p>
        </div>

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        <button
          className="admin-refresh-btn"
          onClick={fetchActiveListings}
          disabled={loading}
          title="Refresh food listings from database"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="admin-search-toolbar">
        <div className="admin-search-wrapper">
          <span className="admin-search-icon">🔍</span>
<<<<<<< HEAD
=======

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search active listings by title, tags, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
<<<<<<< HEAD
=======

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
          {searchQuery && (
            <button
              className="admin-search-clear-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
<<<<<<< HEAD
        <div className="admin-results-count">
          Showing <strong>{filteredListings.length}</strong> of {listings.length} active listing{listings.length === 1 ? "" : "s"}
=======

        <div className="admin-results-count">
          Showing <strong>{filteredListings.length}</strong> of{" "}
          {listings.length} active listing
          {listings.length === 1 ? "" : "s"}
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        </div>
      </div>

      {error && (
        <div className="admin-error-banner" role="alert">
          <div className="admin-error-text">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
<<<<<<< HEAD
          <button className="admin-retry-btn" onClick={fetchActiveListings}>
=======

          <button
            className="admin-retry-btn"
            onClick={fetchActiveListings}
          >
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-container">
          <div className="admin-spinner" />
          <p>Loading active food listings...</p>
        </div>
      ) : (
        <div className="admin-food-table">
          <div className="admin-food-row admin-food-table-header">
            <span>Item Title</span>
            <span>Description</span>
            <span>Tags</span>
            <span>Allergens</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {filteredListings.length === 0 ? (
            <div className="admin-empty-users">
              {searchQuery ? (
                <>
<<<<<<< HEAD
                  <p>No active listings found matching &ldquo;<strong>{searchQuery}</strong>&rdquo;.</p>
=======
                  <p>
                    No active listings found matching &ldquo;
                    <strong>{searchQuery}</strong>&rdquo;.
                  </p>

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
                  <button
                    className="admin-clear-search-btn"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
<<<<<<< HEAD
                <p>No active food listings found in the database.</p>
=======
                <p>
                  No active food listings found in the database.
                </p>
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
              )}
            </div>
          ) : (
            filteredListings.map((item) => {
<<<<<<< HEAD
              const title = item.foodItem || item.listingTitle || item.title || "Untitled Item";
              const desc = item.description || "No description provided.";
              const tags = item.tags || item.tag || "None";
              const allergens = item.allergens || "None";
              const status = (item.status || "ACTIVE").toUpperCase();

              return (
                <div className="admin-food-row" key={item.id}>
                  <span className="food-title-cell" title={title}>
                    <strong>{title}</strong>
                  </span>
                  <span className="food-desc-cell" title={desc}>
                    {desc}
                  </span>
                  <span className="food-tags-cell">
                    <span className="role-badge">{tags}</span>
                  </span>
                  <span className="food-allergens-cell" title={allergens}>
                    {allergens}
                  </span>
                  <span className="food-status-cell">
                    <span className="status-badge badge-active">{status}</span>
                  </span>
                  <span className="food-action-cell">
                    <button
                      className="admin-user-action admin-action-suspend"
                      onClick={() => handleRemoveClick(item.id, title)}
                      disabled={removingId === item.id}
                    >
                      {removingId === item.id ? "Removing..." : "Remove"}
=======
              const title =
                item.foodItem ||
                item.listingTitle ||
                item.title ||
                "Untitled Item";

              const desc =
                item.description || "No description provided.";

              const tags =
                item.tags || item.tag || "None";

              const allergens =
                item.allergens || "None";

              const status = (
                item.status || "ACTIVE"
              ).toUpperCase();

              return (
                <div className="admin-food-row" key={item.id}>
                  <span
                    className="food-title-cell"
                    title={title}
                  >
                    <strong>{title}</strong>
                  </span>

                  <span
                    className="food-desc-cell"
                    title={desc}
                  >
                    {desc}
                  </span>

                  <span className="food-tags-cell">
                    <span className="role-badge">
                      {tags}
                    </span>
                  </span>

                  <span
                    className="food-allergens-cell"
                    title={allergens}
                  >
                    {allergens}
                  </span>

                  <span className="food-status-cell">
                    <span className="status-badge badge-active">
                      {status}
                    </span>
                  </span>

                  <span className="food-action-cell">
                    <button
                      className="admin-user-action admin-action-suspend"
                      onClick={() =>
                        handleRemoveClick(item.id, title)
                      }
                      disabled={removingId === item.id}
                    >
                      {removingId === item.id
                        ? "Removing..."
                        : "Remove"}
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Remove Listing Modal */}
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
      {selectedListing && (
        <div className="admin-remove-modal">
          <div className="admin-remove-modal-content">
            <h3>Remove Listing</h3>

            <p>
<<<<<<< HEAD
              Why are you removing <strong>{selectedListing.title}</strong>?
=======
              Why are you removing{" "}
              <strong>{selectedListing.title}</strong>?
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
            </p>

            <textarea
              value={removalReason}
<<<<<<< HEAD
              onChange={(e) => setRemovalReason(e.target.value)}
=======
              onChange={(e) =>
                setRemovalReason(e.target.value)
              }
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
              placeholder="Enter removal reason..."
              rows="4"
            />

            <div className="admin-remove-modal-actions">
              <button
                className="admin-refresh-btn"
                onClick={handleCancelRemove}
<<<<<<< HEAD
                disabled={removingId === selectedListing.id}
=======
                disabled={
                  removingId === selectedListing.id
                }
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
              >
                Cancel
              </button>

              <button
                className="admin-user-action admin-action-suspend"
                onClick={handleConfirmRemove}
                disabled={
                  !removalReason.trim() ||
                  removingId === selectedListing.id
                }
              >
                {removingId === selectedListing.id
                  ? "Removing..."
                  : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

<<<<<<< HEAD
export default AdminFoodListings;
=======
export default AdminFoodListings;
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
