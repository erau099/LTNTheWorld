import {useState, useEffect} from 'react';
import "./PickupNotificationDetails.css";

function PickupNotificationDetails({food, foodId, onClose, onStatusChange, notification}) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (!listing && foodId) {
            setLoading(true);
            fetch(`/api/food/${foodId}`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch food details");
                    return res.json();
                })
                .then((data) => setListing(data))
                .catch((err) => {
                    console.error(err);
                    setError("Failed to load food listing details.");
                })
                .finally(() => setLoading(false));
        }
    }, [foodId, listing]);

    if (!food && !foodId) return null;

    return (
        <div className= "pickup-modal-overlay" onClick={onClose}>
            <div className="pickup-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pickup-modal-header">
                    <h2>Pickup Details</h2>
                    <button className="pickup-modal-close-btn" onClick={onClose} aria-label="Close modal">
                        &times;
                    </button>
                </div>

                <div className="pickup-modal-body">
                    {error && <div className="pickup-error-msg" role="alert">{error}</div>}
                    {successMessage && <div className="pickup-success-msg" role="alert">{successMessage}</div>}
                
                    {loading ? (
                        <div>Loading details...</div>
                    ) : listing ?(
                        <>
                        <div className="pickup-food-hero">
                            <div
                                className="pickup-food-thumbnail"
                                style={
                                    listing.photos?.length
                                    ? { backgroundImage: `url(${listing.photos[0]})` }
                                    : undefined
                                }
                            />
                            <div className="pickup-food-meta">
                                <h3 className="pickup-food-title">{listing.name}</h3>
                                <p className="pickup-food-description">
                                    {listing.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                        {/*Section for Pickup Details*/}
                        <div className="Pickup-details">
                            <div className="pickup-location">
                                <h4>Pickup Location</h4>
                                <p>{listing.pickupLocation ? `${listing.pickupLocation.address}, 
                                ${listing.pickupLocation.city}, 
                                ${listing.pickupLocation.state} 
                                ${listing.pickupLocation.zip}` 
                                : "No pickup location provided."}</p>
                        </div>

                        <div className="pickup-time">
                            <h4>Pickup Time</h4>
                            <p>
                            {formatPickupTime(listing.pickupTime)}
                            {" - "}
                            {formatPickupTime(listing.pickupEndTime)}
                            </p>
                        </div>
                        </div>
                        </>
                    ) : (
                        <p>Listing Not found.</p>
                    )}
                    
                </div>
            </div>
        </div>

    );
}

export default PickupNotificationDetails;
