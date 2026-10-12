import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// import { useEffect } from 'react'
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api";

import "../index.css";
import "../App.css";
import "../CDashboard.css";
import "./DonorDashboard.css";

// Formats a listing's pickup window, e.g. "Pick up 10/12/2026 @ 4:00 PM - 5:00 PM"
function formatPickup(item) {
	const time = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	const date = new Date(item.date + "T00:00:00").toLocaleDateString();
	return `Pick up ${date} @ ${time(item.pickupTime)} - ${time(item.pickupEndTime)}`;
}

function DonorDashboard() {
    const navigate = useNavigate();
	const { logout } = useAuth();

	// Tracks if the page is scrolled so the header can change style.
	const [scrolled, setScrolled] = useState(false);

	// Controls the gear dropdown menu.
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Listings posted by the logged-in donor, loaded from the backend.
	const [listings, setListings] = useState([]);
	const [loadError, setLoadError] = useState("");
	const [filter, setFilter] = useState("all");

	useEffect(() => {
		apiFetch("/api/food/mine")
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then(setListings)
			.catch(() => setLoadError("Could not load your listings."));
	}, []);

	const visibleListings = listings.filter(
		(item) => filter === "all" || item.status === filter
	);

	// Scroll + dropdown
	useEffect(() => {		
		const onScroll = () => setScrolled(window.scrollY > 10);

		function handleClickOut(e) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
				setDropdownOpen(false);
			}
		}

		window.addEventListener("scroll", onScroll);
		document.addEventListener("mousedown", handleClickOut);

		return () => {
			window.removeEventListener("scroll", onScroll);
			document.removeEventListener("mousedown", handleClickOut);
		};
	}, []);

	// Handles the Profile and Sign Out buttons in the gear dropdown.
	const handleDropdownAction = (item) => {
		if (item === "Profile") {
			navigate("/donor-profile");
		} else if (item === "Sign Out") {
			logout();
			navigate("/");
		}

		setDropdownOpen(false);
	};

	return (
		<div className="donor-dashboard">
			{/* Header navigation for donor pages */}
			<nav className={`nav ${scrolled ? "scrolled" : ""}`}>
				<span className="header_title">Hello, Test</span>

				<div className="header_links">
					<button className="headerbtn" onClick={() => navigate("/")}>
						Home
					</button>

					<button
						className="headerbtn"
						onClick={() => navigate("/donor-past-listings")}
					>
						Past Listings
					</button>

					<button
						className="headerbtn"
						onClick={() => navigate("/donor-profile")}
					>
						Profile
					</button>

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
									type="button"
									className="dropdown_item"
									onClick={() => handleDropdownAction("Profile")}
								>
									Profile
								</button>

								<button
									type="button"
									className="dropdown_item"
									onClick={() => handleDropdownAction("Sign Out")}
								>
									Sign Out
								</button>
							</div>
						)}
					</div>
				</div>
			</nav>

			{/* Main dashboard content */}
			<main className="donor-main">
				<h2>Your Listings</h2>
				{loadError && <p>{loadError}</p>}

				{/* Filter buttons for listing status */}
				<div className="filter-row">
					{["all", "pending", "completed"].map((status) => (
						<button
							key={status}
							className={`filter-button ${filter === status ? "active" : ""}`}
							onClick={() => setFilter(status)}
						>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</button>
					))}
				</div>

				{/* Donor listing cards */}
				<div className="donor-content-row">
					{visibleListings.map((item) => (
						<div key={item.id} className="donor-food-card">
							<div
								className="donor-food-image"
								style={item.photos?.length ? {
									backgroundImage: `url(${item.photos[0]})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								} : undefined}
							>
								<span className="category-tag">{item.tags?.split(",")[0]}</span>
							</div>

							<div className="donor-food-info">
								<div>
									<p className="food-title">{item.foodItem}</p>
									<p className="pickup-time">{formatPickup(item)}</p>
								</div>

								<div className="rating">{item.status}</div>
							</div>
						</div>
					))}

					{/* Button placeholder for adding a new listing */}
					<button className="add-listing-button" 
						onClick={() => navigate("/UploadFoodDetails")}>
							+
						</button>
				</div>
			</main>
		</div>
	);
}

export default DonorDashboard;
