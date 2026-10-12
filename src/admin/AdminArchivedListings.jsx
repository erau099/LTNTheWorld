import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";

function AdminArchivedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchArchivedListings = async () => {
      try {
        const response = await fetch("/api/admin/food/archived");

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data = await response.json();
        setListings(data);
      } catch (err) {
        console.error("Failed to load archived listings:", err);
        setError("Unable to load archived listings.");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedListings();
  }, []);

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <main className="admin-main">
        <section className="admin-welcome">
          <h1>Archived Food Listings</h1>
          <p>View past and archived food listings.</p>
        </section>

        {loading && <p>Loading archived listings...</p>}

        {error && <p>{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <p>No archived listings found.</p>
        )}

        {!loading && !error && listings.length > 0 && (
          <div>
            {listings.map((listing) => (
              <div key={listing.id} className="admin-card">
                <h2>{listing.foodItem}</h2>
                <p>{listing.description}</p>
                <p>Pickup Time: {listing.pickupTime}</p>
                <p>Tags: {listing.tags || "None"}</p>
                <p>Allergens: {listing.allergens || "None"}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminArchivedListings;