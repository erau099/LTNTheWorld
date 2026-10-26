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

	// Listings posted by the logged-in donor, loaded from the backend.
	const [listings, setListings] = useState([]);
	const [loadError, setLoadError] = useState("");

	const [recipientName, setRecipientName] = useState([]);

	useEffect(() => {
		apiFetch("/api/food/mine")
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then((data) => {
				setListings(data)

			// Retrieve the recipient name for each listing
			data.forEach((listing) => {
				const recipientId = listing.claimedByUserId;

				if (recipientId) {
					fetch('/api/users/' + recipientId, {
						credentials: "include"
					})
						.then((res) => (res.ok ? res.json(): Promise.reject(res.status)))
						.then((user) => {
							setRecipientName((prev) => ({
								...prev,
								[recipientId]: user.firstName + " " + user.lastName
							}));
						})
						.catch((error) => {
							console.error("Could not load recipient name:", error)
						});
					}
			});
		})
		.catch(() => setLoadError("Could not load your listings."));
	}, []);

	// Controls the gear dropdown menu.
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Closes the dropdown when the user clicks outside of it.
	useEffect(() => {
		function handleClickOutside(e) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setDropdownOpen(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const[selectFiltering, setSelectedListings] = useState("all")

	const filteredListings = listings.filter((listing) => {
		return selectFiltering === "all" || listing.status?.toLowerCase() === selectFiltering.toLowerCase();
	})

	return (
		<div className="orders-page">
			{/* Header navigation for donor pages */}
			<nav className="nav">
				<span className="header_title">Love Thy Neighbor</span>

				<div className="header_links">
					<Link to="/">
						<button className="headerbtn">Home</button>
					</Link>

					<Link to="/donor-dashboard">
						<button className="headerbtn">Dashboard</button>
					</Link>

					<Link to="/donor-profile">
						<button className="headerbtn">Profile</button>
					</Link>

					{/* Gear dropdown menu */}
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

			{/* Main past listings content */}
			<main className="orders-container">
				<h1 className="orders-title">Past Listings</h1>

				{/* Search bar and status filters */}
				<div className="orders-toolbar">
					<div className="toolbar-left">
						<div className="search-wrapper">
							<input
								type="text"
								placeholder="Search"
								className="orders-search"
							/>

							<img src={searchIcon} alt="search" className="search-icon" />
						</div>

						<div className="orders-filters">
							<button className={selectFiltering === "all" ? "filter-btn all" : "filter-btn all off"} onClick={() => setSelectedListings("all")}>All</button>
							<button className={selectFiltering === "pending" ? "filter-btn pending" : "filter-btn pending off"} onClick={() => setSelectedListings("pending")}>Pending</button>
							<button className={selectFiltering === "cancelled" ? "filter-btn cancelled" : "filter-btn cancelled off"} onClick={() => setSelectedListings("cancelled")}>Cancelled</button>
							<button className={selectFiltering === "completed" ? "filter-btn completed": "filter-btn completed off"} onClick={() => setSelectedListings("completed")}>Completed</button>
						</div>
					</div>
				</div>

				{/* Listings table */}
				<div className="orders-table">
					<div className="orders-header-row">
						<span>Recipient Name</span>
						<span>Date</span>
						<span>Time</span>
						<span>Food Title</span>
						<button className="review-btn header-review-btn">Review</button>
					</div>

					{filteredListings.length > 0 ? (
						filteredListings.map((listing) => (
							<div className="orders-row" 
							key={listing.id}>
								<span>{recipientName[listing.claimedByUserId]}</span>
								<span>{new Date(listing.date + "T00:00:00").toLocaleDateString()}</span>
								<span>{new Date(listing.pickupTime).toLocaleTimeString([], {
									hour: "numeric", minute: "2-digit",
								})}</span>
								<span>{listing.foodItem}</span>

								<button className={`review-btn ${listing.status}`}>
									Review
								</button>
							</div>
						))
					) : (
						<p className="no-orders">No past listings found</p>
					)}
				</div>
			</main>
		</div>
	);
}

export default DonorPastListings;