import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./RecipientPastOrders.css";
import "../index.css";
import "../App.css";
import ReviewModal from "../ReviewModal.jsx";
import searchIcon from "../assets/magnifying-glass.png";

function formatTimeDisplay(timeStr) {
  if (!timeStr) return "N/A";

  // Case 1: If timeStr is already a full ISO string (e.g., "2026-11-08T22:15:00")
  if (timeStr.includes("T") || !isNaN(Date.parse(timeStr))) {
    return new Date(timeStr).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Case 2: If timeStr is a 24-hr time string (e.g., "22:15" or "22:15:00")
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
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Review flow states
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
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Failed to load orders: HTTP ${response.status}`);
            }

            const data = await response.json();
            setOrders(data);
        } catch (err) {
            console.error("Orders fetch error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

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
            navigate("/receiver-profile");
        } else if (action === "Sign Out") {
            if (logout) await logout();
            navigate("/");
        }
        setDropdownOpen(false);
    };

    const handleReviewSubmit = async ({ foodId, rating, comment }) => {
        try {
            const response = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    foodId: Number(foodId),
                    rating: Number(rating),
                    comment
                })
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `HTTP ${response.status}`);
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

    const displayName = user?.firstName || user?.name || "Recipient";

    return (
        <div className="orders-page">
            {/* Header Navigation */}
            <nav className="nav">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="header_title">Hello, {displayName}</span>
                </Link>

                <div className="header_links">
                    <button className="headerbtn" onClick={() => navigate("/")}>Home</button>
                    <button className="headerbtn" onClick={() => navigate("/recipient-dashboard")}>Dashboard</button>
                    <button className="headerbtn" onClick={() => navigate("/receiver-profile")}>Profile</button>

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

            {/* Main Content Container */}
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

                {/* Dashboard-style Filter Tabs */}
                <div className="filter-row">
                    {[
                        { key: "all", label: "All" },
                        { key: "claimed", label: "Claimed" },
                        { key: "scheduled", label: "Scheduled" },
                        { key: "completed", label: "Completed" },
                        { key: "cancelled", label: "Cancelled" }
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

                {/* Orders Table */}
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
                        filteredOrders.map((order) => (
                            <div className="orders-row" key={order.id}>
                                {/* 1. Food Item */}
                                <div className="col-cell col-food">
                                    <span className="food-name">{order.food}</span>
                                    {order.tags && (
                                        <span className="food-tag">{order.tags.split(",")[0]}</span>
                                    )}
                                </div>

                                {/* 2. Donor */}
                                <div className="col-cell col-recipient">
                                    <span className="recipient-name">{order.donor || "Anonymous Donor"}</span>
                                </div>

                                {/* 3. Pickup Schedule (Date & Time combined) */}
                                <div className="col-cell col-schedule">
                                    <span className="schedule-date">{order.date || "N/A"}</span>
                                    <span className="schedule-time">{formatTimeDisplay(order.time)}</span>
                                </div>

                                {/* 4. Status Badge */}
                                <div className="col-cell col-status">
                                    <span className={`status-pill status-${(order.status || "claimed").toLowerCase()}`}>
                                        {order.status || "CLAIMED"}
                                    </span>
                                </div>

                                {/* 5. Action / Feedback */}
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
                                                    comment: order.reviewComment || "No written feedback provided."
                                                })
                                            }
                                        >
                                            ★ {order.reviewRating}/5 View
                                        </button>
                                    ) : (
                                        <button
                                            className={`submit-review-action-btn ${order.status?.toLowerCase() === "completed" ? "active" : "disabled"}`}
                                            type="button"
                                            disabled={order.status?.toLowerCase() !== "completed"}
                                            onClick={() => setReviewOrder(order)}
                                        >
                                            Review
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-orders">No past orders found.</p>
                    )}
                </div>
            </main>

            {/* Submit Review Modal */}
            {reviewOrder && (
                <ReviewModal
                    foodId={reviewOrder.foodId || reviewOrder.id}
                    onClose={() => setReviewOrder(null)}
                    onSubmit={handleReviewSubmit}
                />
            )}

            {/* Read-Only Submitted Review Modal */}
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
                            <span className="rating-number">
                                ({viewReview.rating}/5)
                            </span>
                        </div>
                        <div className="modal-comment-box">
                            <strong style={{ fontSize: "0.85rem", color: "#65756a" }}>YOUR FEEDBACK</strong>
                            <p className="modal-comment-text">
                                "{viewReview.comment}"
                            </p>
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