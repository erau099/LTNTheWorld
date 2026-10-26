import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./DonorPastListings.css";
import "../index.css";
import "../App.css";
import "../CDashboard.css";

import searchIcon from "../assets/magnifying-glass.png";
import { apiFetch } from "../api";

function DonorPastListings() {
    const navigate = useNavigate();

    // Listings posted by the logged-in donor
    const [listings, setListings] = useState([]);
    const [loadError, setLoadError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectFiltering, setSelectedListings] = useState("all");

    // Modal state for viewing reviews
    const [activeReview, setActiveReview] = useState(null);

    useEffect(() => {
        apiFetch("/api/food/mine")
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then(setListings)
            .catch(() => setLoadError("Could not load your listings."));
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

    // Filters for status tabs and search input
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
            {/* Header navigation */}
            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>

                <div className="header_links">
                    <Link to="/"><button className="headerbtn">Home</button></Link>
                    <Link to="/donor-dashboard"><button className="headerbtn">Dashboard</button></Link>
                    <Link to="/donor-profile"><button className="headerbtn">Profile</button></Link>

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
                                    onClick={() => navigate("/donor-profile")}
                                >
                                    Profile
                                </button>
                                <button
                                    className="dropdown_item"
                                    type="button"
                                    onClick={() => navigate("/")}
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <main className="orders-container">
                <h1 className="orders-title">Past Listings</h1>

                {/* Toolbar */}
                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrapper">
                            <input
                                type="text"
                                placeholder="Search by food or recipient..."
                                className="orders-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <img src={searchIcon} alt="search" className="search-icon" />
                        </div>

                        <div className="orders-filters">
                            <button
                                className={selectFiltering === "all" ? "filter-btn all" : "filter-btn all off"}
                                onClick={() => setSelectedListings("all")}
                            >
                                All
                            </button>
                            <button
                                className={selectFiltering === "claimed" ? "filter-btn pending" : "filter-btn pending off"}
                                onClick={() => setSelectedListings("claimed")}
                            >
                                Claimed
                            </button>
                            <button
                                className={selectFiltering === "cancelled" ? "filter-btn cancelled" : "filter-btn cancelled off"}
                                onClick={() => setSelectedListings("cancelled")}
                            >
                                Cancelled
                            </button>
                            <button
                                className={selectFiltering === "completed" ? "filter-btn completed" : "filter-btn completed off"}
                                onClick={() => setSelectedListings("completed")}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listings table */}
                <div className="orders-table">
                    <div className="orders-header-row">
                        <span>Recipient</span>
                        <span>Date</span>
                        <span>Time</span>
                        <span>Food Title</span>
                        <span>Status</span>
                        <span className="header-review-btn">Review</span>
                    </div>

                    {loadError ? (
                        <p className="no-orders error-msg">{loadError}</p>
                    ) : filteredListings.length > 0 ? (
                        filteredListings.map((listing) => (
                            <div className="orders-row" key={listing.id}>
                                <span>{listing.recipientName || "Unclaimed"}</span>
                                <span>
                                    {listing.date
                                        ? new Date(listing.date + "T00:00:00").toLocaleDateString()
                                        : "N/A"}
                                </span>
                                <span>
                                    {listing.pickupTime
                                        ? new Date(listing.pickupTime).toLocaleTimeString([], {
                                              hour: "numeric",
                                              minute: "2-digit"
                                          })
                                        : "N/A"}
                                </span>
                                <span>{listing.foodItem}</span>

                                <span className={`status-pill status-${listing.status?.toLowerCase()}`}>
                                    {listing.status || "ACTIVE"}
                                </span>

                                <div className="review-col">
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
                                            ⭐ {listing.reviewRating}/5 View
                                        </button>
                                    ) : (
                                        <span className="no-review-label">No review</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-orders">No past listings found</p>
                    )}
                </div>
            </main>

            {/* Read-Only Review Detail Modal */}
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
                        <p className="modal-stars">
                            {"★".repeat(activeReview.rating || 0)}
                            {"☆".repeat(Math.max(0, 5 - (activeReview.rating || 0)))}
                            <span className="rating-number">
                                ({activeReview.rating}/5)
                            </span>
                        </p>
                        <div className="modal-comment-box">
                            <strong>Feedback:</strong>
                            <p className="modal-comment-text">
                                {activeReview.comment}
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
        </div>
    );
}

export default DonorPastListings;