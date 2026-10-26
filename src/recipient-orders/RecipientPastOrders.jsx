import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./RecipientPastOrders.css";
import "../index.css";
import ReviewModal from "../ReviewModal.jsx"; 

import searchIcon from "../assets/magnifying-glass.png";
import { apiFetch } from "../api";

// Temporary mock data for recipient past orders.
const orders = [
	{
		id: 1,
		donor: "Robin Roberts 2",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 2,
		status: "completed",
	},
	{
		id: 2,
		donor: "Robin Roberts 4",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 4,
		status: "completed",
	},
	{
		id: 3,
		donor: "Robin Roberts 5",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 5,
		status: "cancelled",
	},
	{
		id: 4,
		donor: "Robin Roberts 6",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 5,
		status: "completed",
	},
	{
		id: 4,
		donor: "Robin Roberts 7",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 5,
		status: "cancelled",
	},
	{
		id: 5,
		donor: "Robin Roberts 8",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 3,
		status: "pending",
	},
	{
		id: 6,
		donor: "Robin Roberts 9",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 3,
		status: "pending",
	},
	{
		id: 7,
		donor: "Robin Roberts 10",
		date: "01/03/2026",
		time: "1:30pm",
		food: "Donuts",
		foodId: 2,
		status: "pending",
	},
];

function RecipientPastOrders() {
	const navigate = useNavigate();

	// Controls the gear dropdown menu.
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const dropdownRef = useRef(null);
	const [reviewOrder, setReviewOrder] = useState(null);

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

	// Retrieve orders from the backend
	const [orders, setOrders] = useState([]);
	const[ordersError, setOrdersError] = useState("");

	const [donorName, setDonorName] = useState({});

	
	useEffect(() => {
		apiFetch("/api/orders/mine")
			.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
			.then((data) => {
				setOrders(data);
				
				// Retrieve donor name for the orders
				data.forEach((order) => {
					const donorId = order.food?.userId;

					if(donorId) {
						fetch('/api/users/' + donorId, {
							credentials: "include"
						})
							.then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
							.then((user) => {
								setDonorName((prev) => ({
									...prev,
									[donorId]: user.firstName + " " + user.lastName
								}));
								})
								.catch((error) => {
									console.error("Could not load donor name:", error)
							});
					}
				})
			})
			.catch(() => setOrdersError("Could not load your orders."));
	}, []);

	// Review
	const handleReviewSubmit = async ({ foodId, rating, comment }) => {
		try {
			const response = await fetch('/api/reviews', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: '54336d41-7416-4484-a5fe-69c17933d229',
					foodId,
					rating,
					comment,
				}),
			});

			if (!response.ok) {
				const message = await response.text();
				throw new Error(message || `HTTP ${response.status}`);
			}

			alert('Review submitted successfully!');
			setReviewOrder(null);
		} catch (error) {
			console.error('Failed to submit review:', error);
			alert('Could not submit review. Check the console for details.');
		}
	};

	
	const [selectFiltering, setSelectedOrders] = useState("all")

	const filteredOrders = orders.filter((order) => {
		return selectFiltering === "all" || order.status?.toLowerCase() === selectFiltering.toLowerCase();
	})

	return (
		<div className="orders-page">
			{/* Header navigation for recipient pages */}
			<nav className="nav">
				<span className="header_title">Love Thy Neighbor</span>

				<div className="header_links">
					<Link to="/">
						<button className="headerbtn">Home</button>
					</Link>

					<Link to="/recipient-dashboard">
						<button className="headerbtn">Dashboard</button>
					</Link>

					<Link to="/receiver-profile">
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

			{/* Main past orders content */}
			<main className="orders-container">
				<h1 className="orders-title">Orders</h1>

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
							<button className={selectFiltering === "all" ? "filter-button all" : "filter-button all off"} onClick={() => setSelectedOrders("all")}>All</button>
							<button className={selectFiltering === "pending" ? "filter-btn pending" : "filter-btn pending off"} onClick={() => setSelectedOrders("pending")}>Pending</button>
							<button className={selectFiltering === "cancelled" ? "filter-btn cancelled" : "filter-btn cancelled off"} onClick={() => setSelectedOrders("cancelled")}>Cancelled</button>
							<button className={selectFiltering === "completed" ? "filter-btn completed": "filter-btn completed off"} onClick={() => setSelectedOrders("completed")}>Completed</button>
						</div>
					</div>
				</div>

				{/* Orders table */}
				<div className="orders-table">
					<div className="orders-header-row">
						<span>Donor Name</span>
						<span>Date</span>
						<span>Time</span>
						<span>Food Title</span>
						<button className="review-btn header-review-btn" type="button">Review</button>
					</div>

					{filteredOrders.length > 0 ? (
						filteredOrders.map((order, id) => (
							<div className="orders-row"
							key={id}>
								<span>{donorName[order.food?.userId] || "Unknown"}</span>
								<span>{order.food?.date ? new Date(order.food.date + "T00:00:00").toLocaleDateString() : ""}</span>
								<span>{order.food?.pickupTime ? new Date(order.food.pickupTime).toLocaleTimeString([], {
									hour: "numeric", minute: "2-digit",
								}) :""}</span>
								<span>{order.food?.foodItem}</span>

								<button
									className={`review-btn ${order.status?.toLowerCase()}`}
									type="button"
									disabled={order.status !== "completed"}
									onClick={() => setReviewOrder(order)}>
									Review
								</button>
							</div>
						))
					) : (
						<p className="no-orders">No past orders found</p>
					)}
				</div>
			</main>
			
			{reviewOrder && (
				<ReviewModal
					foodId={reviewOrder.foodId}
					onClose={() => setReviewOrder(null)}
					onSubmit={handleReviewSubmit}
				/>
			)}

		</div>
	);
}

export default RecipientPastOrders;
