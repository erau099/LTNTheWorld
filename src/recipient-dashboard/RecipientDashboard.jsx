import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "../index.css";
import "../App.css";
import "../CDashboard.css";
import "./RecipientDashboard.css";

function RecipientDashboard() {
	const navigate = useNavigate();

	// Tracks if the page is scrolled so the header can change style.
	const [scrolled, setScrolled] = useState(false);

	// Controls the gear dropdown menu.
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Temporary mock food listing data for recipient discovery.
	const listings = [
		{
			donor: "Robin Roberts",
			food: "Donuts",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "N/A",
			category: "Fresh / Hot",
		},
		{
			donor: "Frankie Flummer",
			food: "Canned Tuna",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "3.9",
			category: "Canned",
		},
		{
			donor: "Jane Jonathans",
			food: "Rice Bowls",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "4.9",
			category: "Fresh / Hot",
		},
		{
			donor: "Joshua Joe",
			food: "Black Beans",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "1.2",
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
			navigate("/receiver-profile");
		} else if (item === "Sign Out") {
			navigate("/");
		}

		setDropdownOpen(false);
	};

	return (
		<div className="recipient-dashboard">
			{/* Header navigation for recipient pages */}
			<nav className={`nav ${scrolled ? "scrolled" : ""}`}>
				<span className="header_title">Hello, Test</span>

				<div className="header_links">
					<button className="headerbtn" onClick={() => navigate("/")}>
						Home
					</button>

					<button
						className="headerbtn"
						onClick={() => navigate("/recipient-past-orders")}
					>
						Orders
					</button>

					<button
						className="headerbtn"
						onClick={() => navigate("/receiver-profile")}
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
			<main className="recipient-main">
				{/* Filter buttons for food categories */}
				<div className="filter-row">
					<button className="filter-button active">All</button>
					<button className="filter-button">Fresh / Hot</button>
					<button className="filter-button">Canned</button>
				</div>

				<h2>Top Picks:</h2>

				{/* Food cards shown to recipients */}
				<section className="top-picks-grid">
					{listings.map((item, index) => (
						<article className="food-card" key={index}>
							<div className="food-image">
								<span className="category-tag">{item.category}</span>
							</div>

							<div className="food-info">
								<div>
									<p className="food-title">
										<strong>{item.donor}:</strong> {item.food}
									</p>

									<p className="pickup-time">{item.pickup}</p>
								</div>

								<div className="rating">
									<span>★</span>
									{item.rating}
								</div>
							</div>
						</article>
					))}
				</section>
			</main>
		</div>
	);
}

export default RecipientDashboard;
