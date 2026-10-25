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

	// Set VITE_USE_MOCK_FOOD=true in a local .env.local to test without PostgreSQL.
	// Mock mode is explicit; API failures never masquerade as successful data.
	const useMockFood = import.meta.env.VITE_USE_MOCK_FOOD === "true";
	const [listings, setListings] = useState([]);
	const [listingsLoading, setListingsLoading] = useState(true);
	const [listingsError, setListingsError] = useState("");
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		const controller = new AbortController();

		const mapFood = (item) => {
			const pickupDate = item.pickupTime
				? item.pickupTime.replace("T", " ").slice(0, 16)
				: "Not specified";
			return {
				id: item.id,
				food: item.foodItem || "Untitled food",
				donor: "Donor name unavailable",
				pickup: `Pick up: ${pickupDate}`,
				rating: "N/A",
				category: item.tags || "Uncategorized",
				allergies: typeof item.allergens === "string"
					? item.allergens.split(",").map((value) => value.trim()).filter(Boolean)
					: [],
				description: item.description || "No description provided",
				status: item.status || "UNKNOWN",
				photos: Array.isArray(item.photos) ? item.photos : [],
			};
		};

		async function loadListings() {
			setListingsLoading(true);
			setListingsError("");
			try {
				let food;
				if (useMockFood) {
					food = [
						{ id: 1, foodItem: "Donuts", description: "Assorted donuts", pickupTime: "2026-10-12T16:00:00", tags: "Fresh / Hot", allergens: "Milk, Wheat", status: "ACTIVE" },
						{ id: 2, foodItem: "Canned Tuna", description: "Unopened cans", pickupTime: "2026-10-12T17:00:00", tags: "Canned", allergens: "Fish", status: "UNAVAILABLE" },
					];
				} else {
					const response = await fetch("/api/food", { signal: controller.signal });
					if (!response.ok) throw new Error(`Food API returned ${response.status}`);
					food = await response.json();
				}
				if (!Array.isArray(food)) throw new Error("Food API did not return a list");
				const activeFood = food.filter((item) => (item.status || "ACTIVE").toUpperCase() === "ACTIVE");
				if (!controller.signal.aborted) setListings(activeFood.map(mapFood));
			} catch (error) {
				if (!controller.signal.aborted) {
					console.error("Error loading food listings:", error);
					setListingsError("Unable to load food listings. Please try again later.");
					setListings([]);
				}
			} finally {
				if (!controller.signal.aborted) setListingsLoading(false);
			}
		}
		loadListings();
		return () => controller.abort();
	}, [useMockFood, retryCount]);

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
	const [selectListing, setSelectListing] = useState(false);
	const [requesting, setRequesting] = useState(false);
	const [requestError, setRequestError] = useState("");

	const handleRequestFood = async (foodItem) => {
		if (!foodItem) return;
		setRequesting(true);
		setRequestError("");
		const token = localStorage.getItem("token");

		try {
			const res = await fetch(`/api/food/${foodItem.id}/request`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				throw new Error(errorText || "Failed to request food item");
			}

			setListings((prev) => prev.filter((item) => item.id !== foodItem.id));
			setSelectListing(false);
			alert("Success! Your request has been sent to the donor. They will coordinate pickup with you.");
		} catch (err) {
			console.error("Error requesting food:", err);
			setRequestError(err.message || "Failed to request food.");
		} finally {
			setRequesting(false);
		}
	};


	// Handles the filtering for the listings
	const [selectFiltering, setSelectedFiltering] = useState("all")

	const filteredListings = listings.filter((item) => {
		return selectFiltering === "all" || item.category === selectFiltering;
	})
	// Stores the logged-in recipient's saved allergies
	const [recipientAllergies, setRecipientAllergies] = useState([]);

	// Loads the logged-in recipient's allergies from the backend
	useEffect(() => {
		const token = localStorage.getItem("token");

		if (!token) return;

		fetch("/api/users/me/allergies", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error("Unable to load allergies");
				}

				return response.text();
			})
			.then((allergies) => {
				const allergyList = allergies
					? allergies.split(",").map((allergy) => allergy.trim()).filter(Boolean)
					: [];

				setRecipientAllergies(allergyList);
			})
			.catch((error) => {
				console.error("Error loading recipient allergies:", error);
			});
	}, []);

	// Checks the selected food listing against the recipient's saved allergies
	const handleListingClick = (item) => {
		const listingAllergies = item.allergies || [];

		const matchingAllergies = listingAllergies.filter((listingAllergy) =>
			recipientAllergies.some((recipientAllergy) =>
				recipientAllergy.toLowerCase().replace(/s$/, "") ===
				listingAllergy.toLowerCase().replace(/s$/, "")
			)
		);

		if (matchingAllergies.length > 0) {
			alert(
				`Allergy Warning! This food contains: ${matchingAllergies.join(", ")}`
			);
		}

		setSelectListing(item);
	};

	// Gets the food condition from either backend data or current mock listings
	const getFoodCondition = (item) => {
		return item.tags || item.category || "Not specified";
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
					<button className={selectFiltering === "all" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("all")}>All</button>
					<button className={selectFiltering === "Fresh / Hot" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Fresh / Hot")}>Fresh / Hot</button>
					<button className={selectFiltering === "Canned" ? "filter-button active" : "filter-button"} onClick={() => setSelectedFiltering("Canned")}>Canned</button>
				</div>

				<h2>Top Picks:</h2>

				{/* Food cards shown to recipients */}
				{useMockFood && <p role="status">Demo food listings (mock mode)</p>}
				{listingsLoading && <p role="status">Loading food listings...</p>}
				{listingsError && (
					<div role="alert">
						<p>{listingsError}</p>
						<button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
					</div>
				)}
				{!listingsLoading && !listingsError && filteredListings.length === 0 && (
					<p>No food listings found for this category.</p>
				)}
				<section className="top-picks-grid">
					{filteredListings.map((item) => (
						<article className="food-card" 
									key={item.id} 
									onClick={() => handleListingClick(item)}>
							<div className="food-image"
								style={item.photos?.length ? {
									backgroundImage: `url(${item.photos[0]})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								} : undefined}
							>
								<span className="category-tag">{getFoodCondition(item)}</span>
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
						<div
							className="food_card_popup"
							onClick={() => setSelectListing(false)}
						>
							<div
								className="food_popup_background"
								role="dialog"
								aria-modal="true"
								aria-label={`${selectListing.food} details`}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="food-popup-heading">
									<div>
										<span className="food-popup-eyebrow">
											FOOD LISTING
										</span>
										<h2>{selectListing.food}</h2>
									</div>

									<button
										type="button"
										className="food-popup-close"
										aria-label="Close food details"
										onClick={() => setSelectListing(false)}
									>
										×
									</button>
								</div>

								<div className="food-popup-content">
									<div className="food-popup-hero">
										<div
											className="food_popup_image"
											role="img"
											aria-label={selectListing.photos?.length ? `${selectListing.food} photograph` : "Placeholder food photograph"}
											style={selectListing.photos?.length ? {
												backgroundImage: `url(${selectListing.photos[0]})`,
												backgroundSize: "cover",
												backgroundPosition: "center",
											} : undefined}
										/>

										<span
											className={`food-status-badge ${
												selectListing.status === "ACTIVE"
													? "available"
													: selectListing.status === "UNAVAILABLE"
													? "unavailable"
													: "unknown"
											}`}
										>
											●{" "}
											{selectListing.status === "ACTIVE"
												? "Available"
												: selectListing.status === "UNAVAILABLE"
												? "Unavailable"
												: "Status unknown"}
										</span>
									</div>

									<div className="food-popup-section food-popup-donor">
										<span className="food-popup-label">
											POSTED BY
										</span>
										<strong>{selectListing.donor}</strong>
									</div>

									<div className="food-popup-section">
										<h3>About this food</h3>
										<p className="food-popup-description">
											{selectListing.description ||
												"No description provided."}
										</p>
									</div>

									<div className="food-popup-details-grid">
										<div className="food-popup-section">
											<h3>Category</h3>
											<span className="food-popup-tag">
												{selectListing.category}
											</span>
										</div>

										<div className="food-popup-section">
											<h3>Pickup time</h3>
											<p className="food-popup-pickup">
												◷ {selectListing.pickup}
											</p>
										</div>
									</div>

									<div className="food-popup-section">
										<h3>Allergen information</h3>

										<div className="food-popup-tags">
											{selectListing.allergies?.length ? (
												selectListing.allergies.map(
													(allergy, index) => (
														<span
															className="food-popup-allergen"
															key={`${allergy}-${index}`}
														>
															{allergy}
														</span>
													)
												)
											) : (
												<span className="food-popup-muted">
													No allergens listed (not a guarantee
													of allergen-free food).
												</span>
											)}
										</div>
									</div>
								</div>

								<div className="food-popup-actions">
									<button
										type="button"
										className="food-popup-back"
										onClick={() => setSelectListing(false)}
									>
										Back to listings
									</button>

									<button
										type="button"
										className="food-popup-submit"
										disabled
										title="Food requests are not available yet"
									>
										Request food (coming soon)
									</button>
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
