import "./RecipientPastOrders.css";
import CDashboard from "../CDashboard";
import searchIcon from "../assets/magnifying-glass.png";

const orders = [
  { id: 1, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "pending" },
  { id: 2, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "pending" },
  { id: 3, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "approved" },
  { id: 4, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "approved" },
  { id: 5, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },
  { id: 6, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },
  { id: 7, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },
  { id: 8, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },
  { id: 9, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },
  { id: 10, donor: "Robin Roberts", date: "01/03/2026", time: "1:30pm", food: "Donuts", status: "completed" },

];

function RecipientPastOrders() {
  return (
    <div className="orders-page">

      {/* HEADER STRUCTURE.*/}
        <CDashboard />

      <main className="orders-container">
        <h1 className="orders-title">Orders</h1>

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


        <div className="orders-table">
          <div className="orders-header-row">
            <span>Donor Name</span>
            <span>Date</span>
            <span>Time</span>
            <span>Food Title</span>
            <button className="review-btn header-review-btn">
                Review
            </button>
          </div>

          {orders.length > 0 ? (
            orders.map((order) => (
              <div className="orders-row" key={order.id}>
                <span>{order.donor}</span>
                <span>{order.date}</span>
                <span>{order.time}</span>
                <span>{order.food}</span>
                <button className={`review-btn ${order.status}`}>
                  Review
                </button>
              </div>
            ))
          ) : (
            <p className="no-orders">No past orders found</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default RecipientPastOrders;