import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "../index.css";
import "../App.css";
import "../CDashboard.css";
import "./DonorDashboard.css";

function DonorDashboard() {
    const navigate = useNavigate();

	// Tracks if the page is scrolled so the header can change style.
	const [scrolled, setScrolled] = useState(false);

	// Controls the gear dropdown menu.
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Temporary mock listing data for the donor dashboard.
	const listings = [
		{
			food: "Donuts",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "3.9",
			category: "Fresh / Hot",
		},
		{
			food: "Canned Tuna",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "4.2",
			category: "Canned",
		},
		{
			food: "Rice Bowls",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "4.9",
			category: "Fresh / Hot",
		},
		{
			food: "Black Beans",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "3.5",
			category: "Canned",
		},
	];

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
			navigate("/");
		}

		setDropdownOpen(false);
	};

	// Handles the cards to be able to be shown when clicked
	const [selectListing, setSelectListing] = useState(false)

	// Handles the filtering for the listings
	const [selectFiltering, setSelectedFiltering] = useState("All")

	const filteredListings = listings.filter((item) => {
		return selectFiltering === "All" || item.category === selectFiltering;
	})

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

				{/* Filter buttons for listing status */}
				<div className="filter-row">
					<button className={selectFiltering === "All" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("All")}>All</button>
					<button className={selectFiltering === "Pending" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Pending")}>Pending</button>
					<button className={selectFiltering === "Completed" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Completed")}>Completed</button>
				</div>

				{/* Donor listing cards */}
				<div className="donor-content-row">
					{filteredListings.map((item, index) => (
						<div key={index} className="donor-food-card">
							<div className="donor-food-image">
								<span className="category-tag">{item.category}</span>
							</div>

							<div className="donor-food-info">
								<div>
									<p className="food-title">{item.food}</p>
									<p className="pickup-time">{item.pickup}</p>
								</div>

								<div className="rating">
									<span>⭐</span> {item.rating}
								</div>
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
