import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./RecipientPastOrders.css";
import "../index.css";
import ReviewModal from "../ReviewModal.jsx";
import searchIcon from "../assets/magnifying-glass.png";

function RecipientPastOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Review flow states
    const [reviewOrder, setReviewOrder] = useState(null);      // Opens submit modal
    const [viewReview, setViewReview] = useState(null);        // Opens view modal for already-reviewed item

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

            // Update client state immediately so the button converts into the submitted review state
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
            order.status?.toLowerCase() === selectFiltering.toLowerCase();

        const matchesSearch =
            (order.donor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (order.food?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    return (
        <div className="orders-page">
            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>

                <div className="header_links">
                    <Link to="/"><button className="headerbtn">Home</button></Link>
                    <Link to="/recipient-dashboard"><button className="headerbtn">Dashboard</button></Link>
                    <Link to="/receiver-profile"><button className="headerbtn">Profile</button></Link>

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
                                    onClick={() => navigate("/receiver-profile")}
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

            <main className="orders-container">
                <h1 className="orders-title">Past Orders</h1>

                <div className="orders-toolbar">
                    <div className="toolbar-left">
                        <div className="search-wrapper">
                            <input
                                type="text"
                                placeholder="Search by donor or food item..."
                                className="orders-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <img src={searchIcon} alt="search" className="search-icon" />
                        </div>

                        <div className="orders-filters">
                            <button
                                className={selectFiltering === "all" ? "filter-btn all" : "filter-btn all off"}
                                onClick={() => setSelectedOrders("all")}
                            >
                                All
                            </button>
                            <button
                                className={selectFiltering === "pending" || selectFiltering === "claimed" ? "filter-btn pending" : "filter-btn pending off"}
                                onClick={() => setSelectedOrders("claimed")}
                            >
                                Claimed
                            </button>
                            <button
                                className={selectFiltering === "cancelled" ? "filter-btn cancelled" : "filter-btn cancelled off"}
                                onClick={() => setSelectedOrders("cancelled")}
                            >
                                Cancelled
                            </button>
                            <button
                                className={selectFiltering === "completed" ? "filter-btn completed" : "filter-btn completed off"}
                                onClick={() => setSelectedOrders("completed")}
                            >
                                Completed
                            </button>
                        </div>
                    </div>
                </div>

                <div className="orders-table">
                    <div className="orders-header-row">
                        <span>Donor Name</span>
                        <span>Date</span>
                        <span>Time</span>
                        <span>Food Title</span>
                        <span>Status</span>
                        <span className="header-review-btn">Review</span>
                    </div>

                    {loading ? (
                        <p className="no-orders">Loading orders...</p>
                    ) : error ? (
                        <p className="no-orders error-msg">{error}</p>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                            <div className="orders-row" key={order.id}>
                                <span>{order.donor}</span>
                                <span>{order.date}</span>
                                <span>{order.time}</span>
                                <span>{order.food}</span>

                                <span className={`status-pill status-${order.status?.toLowerCase()}`}>
                                    {order.status || "CLAIMED"}
                                </span>

                                <div className="review-col">
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
                                            ⭐ {order.reviewRating}/5 View
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
                        <p className="no-orders">No past orders found</p>
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
                        <p className="modal-stars">
                            {"★".repeat(viewReview.rating || 0)}
                            {"☆".repeat(Math.max(0, 5 - (viewReview.rating || 0)))}
                            <span className="rating-number">
                                ({viewReview.rating}/5)
                            </span>
                        </p>
                        <div className="modal-comment-box">
                            <strong>Your Feedback:</strong>
                            <p className="modal-comment-text">
                                {viewReview.comment}
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