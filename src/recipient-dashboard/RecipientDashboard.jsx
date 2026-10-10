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
			allergies: ["Peanut", "Tomato", "Pickles"],
		},
		{
			donor: "Frankie Flummer",
			food: "Canned Tuna",
			pickup: "Pick up 01/01/2001 @ 16:00 - 17:00",
			rating: "3.9",
			category: "Canned",
			allergies: ["Tomato"],
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
			pickup: "Pick up: 01/01/2001 @ 16:00 - 17:00",
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

	// Handles the cards to be able to be shown when clicked
	const [selectListing, setSelectListing] = useState(false)

	// Handles the filtering for the listings
	const [selectFiltering, setSelectedFiltering] = useState("All")

	const filteredListings = listings.filter((item) => {
		return selectFiltering === "All" || item.category === selectFiltering;
	})

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
					<button className={selectFiltering === "All" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("All")}>All</button>
					<button className={selectFiltering === "Fresh / Hot" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Fresh / Hot")}>Fresh / Hot</button>
					<button className={selectFiltering === "Canned" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Canned")}>Canned</button>
				</div>

				<h2>Top Picks:</h2>

				{/* Food cards shown to recipients */}
				<section className="top-picks-grid">
					{filteredListings.map((item, index) => (
						<article className="food-card" 
									key={index} 
									onClick={() => setSelectListing(item)}>
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

				
				<section>
					{selectListing && (
						<div className="food_card_popup"
								onClick={() => setSelectListing(false)}>
							<div className="food_popup_background"
								onClick={(e) => e.stopPropagation()}>

									<div className="upload_banner">
										<section className="upload_header">
											<p className="num_text_on">{selectListing.food}</p>
										</section>

										<div className="food_popup_image"></div>

										<div className="food_popup_info">
											<p className="donor_name_popup">Posted by: {selectListing.donor}</p>
											<p className="category_popup">Category: {selectListing.category}</p>
											<p className="pickup_popup">{selectListing.pickup}</p>
											<p className="rating_popup">★ {selectListing.rating}</p>
											<div className="allergies_popup">
												<p> Allergies: </p>
												{selectListing.allergies?.map((allergy, index) => (
													<span className="allergy_btn" key={index}> {allergy}</span>
												))}
											</div>
											<button className="upload_cancel_btn"
												onClick={() => setSelectListing(false)}>Back</button>
											<button className="upload_next_btn">Submit</button>
										</div>
									</div>
								

							</div>
						</div>
					)}

				</section>
			</main>
		</div>
	);
}

export default RecipientDashboard;
