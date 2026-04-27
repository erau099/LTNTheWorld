import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./DonorPastListings.css";
import "../index.css";

import searchIcon from "../assets/magnifying-glass.png";

// Temporary mock data for donor past listings.
const listings = [
	{
		id: 1,
		donor: "Robin Roberts",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		status: "pending",
	},
	{
		id: 2,
		donor: "Robin Roberts",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		status: "pending",
	},
	{
		id: 3,
		donor: "Robin Roberts",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		status: "approved",
	},
	{
		id: 4,
		donor: "Robin Roberts",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		status: "approved",
	},
	{
		id: 5,
		donor: "Robin Roberts",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		status: "completed",
	},
];

function DonorPastListings() {
	const navigate = useNavigate();

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
							<button className="filter-btn pending">Pending</button>
							<button className="filter-btn approved">Approved</button>
							<button className="filter-btn completed">Completed</button>
						</div>
					</div>
				</div>

				{/* Listings table */}
				<div className="orders-table">
					<div className="orders-header-row">
						<span>Donor Name</span>
						<span>Date</span>
						<span>Time</span>
						<span>Food Title</span>
						<button className="review-btn header-review-btn">Review</button>
					</div>

					{listings.length > 0 ? (
						listings.map((listing) => (
							<div className="orders-row" key={listing.id}>
								<span>{listing.donor}</span>
								<span>{listing.date}</span>
								<span>{listing.time}</span>
								<span>{listing.food}</span>

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
