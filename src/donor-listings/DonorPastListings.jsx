import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DonorNotificationBell from "../donor-dashboard/DonorNotificationBell";
import PickupCoordinationModal from "../donor-dashboard/PickupCoordinationModal";
import "./DonorPastListings.css";
import "../index.css";
import "../App.css";

import searchIcon from "../assets/magnifying-glass.png";
import { apiFetch } from "../api";

function DonorPastListings() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [listings, setListings] = useState([]);
    const [loadError, setLoadError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectFiltering, setSelectedListings] = useState("all");

    // Modal state for viewing reviews
    const [activeReview, setActiveReview] = useState(null);

    // Active listing opened in the Pickup Coordination Modal
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

    // Gear dropdown logic
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDropdownAction = async (action) => {
        if (action === "Profile") {
            navigate("/donor-profile");
        } else if (action === "Sign Out") {
            await logout();
            navigate("/");
        }
        setDropdownOpen(false);
    };

    // Bell notification selection handler
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

    // Filter by status and search keyword
    const filteredListings = listings.filter((listing) => {
        const matchesStatus =
            selectFiltering === "all" ||
            listing.status?.toLowerCase() === selectFiltering.toLowerCase();

        const matchesSearch =
            (listing.foodItem?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (listing.recipientName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const displayName = user?.firstName || user?.name || "Donor";

    return (
        <div className="orders-page">
            {/* Header Navigation matching Donor Dashboard */}
            <nav className="nav">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="header_title">Hello, {displayName}</span>
                </Link>

                <div className="header_links">
                    <button className="headerbtn" onClick={() => navigate("/")}>Home</button>
                    <button className="headerbtn" onClick={() => navigate("/donor-dashboard")}>Dashboard</button>
                    <button className="headerbtn" onClick={() => navigate("/donor-profile")}>Profile</button>

                    {/* Notification Bell */}
                    <DonorNotificationBell onSelectNotification={handleSelectNotification} />

                    {/* Gear Dropdown */}
                    <div className="gear_wrap" ref={dropdownRef}>
                        <button
                            className="gear_btn"
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                        >
                            ⚙
                        </button>

                        {dropdownOpen && (
                            <div className="dropdown">
                                <button
                                    className="dropdown_item"
                                    type="button"
                                    onClick={() => handleDropdownAction("Profile")}
                                >
                                    Profile
                                </button>
                                <button
                                    className="dropdown_item"
                                    type="button"
                                    onClick={() => handleDropdownAction("Sign Out")}
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="orders-container">
                <div className="orders-header-bar">
                    <h1 className="orders-title">Past Listings</h1>
                    
                    {/* Search Bar */}
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

                {/* Status Filters synced with Dashboard style */}
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

                {/* Listings Table Card */}
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
                                {/* 1. Food Item */}
                                <div className="col-cell col-food">
                                    <span className="food-name">{listing.foodItem}</span>
                                    {listing.tags && (
                                        <span className="food-tag">{listing.tags.split(",")[0]}</span>
                                    )}
                                </div>

                                {/* 2. Recipient */}
                                <div className="col-cell col-recipient">
                                    <span className="recipient-name">
                                        {listing.recipientName || "Unclaimed"}
                                    </span>
                                </div>

                                {/* 3. Combined Date & Time */}
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
                                                  minute: "2-digit"
                                              })
                                            : "Time not set"}
                                    </span>
                                </div>

                                {/* 4. Status Badge */}
                                <div className="col-cell col-status">
                                    <span className={`status-pill status-${listing.status?.toLowerCase()}`}>
                                        {listing.status || "ACTIVE"}
                                    </span>
                                </div>

                                {/* 5. Feedback View */}
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
                                                    comment: listing.reviewComment || "No written feedback provided."
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

            {/* Read-Only Review Modal */}
            {activeReview && (
                <div
                    className="modal-overlay"
                    onClick={() => setActiveReview(null)}
                >
                    <div
                        className="donor-review-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="modal-title">Review for {activeReview.foodTitle}</h3>
                        <p className="modal-field">
                            <strong>From:</strong> {activeReview.reviewer}
                        </p>
                        <div className="modal-stars">
                            {"★".repeat(activeReview.rating || 0)}
                            {"☆".repeat(Math.max(0, 5 - (activeReview.rating || 0)))}
                            <span className="rating-number">
                                ({activeReview.rating}/5)
                            </span>
                        </div>
                        <div className="modal-comment-box">
                            <strong style={{ fontSize: "0.85rem", color: "#6b7280" }}>RECIPIENT COMMENT</strong>
                            <p className="modal-comment-text">
                                "{activeReview.comment}"
                            </p>
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

            {/* Pickup Coordination Modal (opens via notification bell) */}
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