import { Link, Navigate, useLocation } from "react-router-dom"
import UploadLayout from "./UploadLayout.jsx"

// Formats "2026-10-11T16:00:00" as "4:00 PM"
function formatTime(dateTime) {
    return new Date(dateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function FoodSubmission() {
    const { state } = useLocation();
    const listing = state?.listing;

    // Only reachable right after posting a listing
    if (!listing) {
        return <Navigate to="/donor-dashboard" replace />;
    }

    const pickupDate = new Date(listing.date + "T00:00:00").toLocaleDateString();

    return (
        <UploadLayout step={0}>
            <div className="upload_body">
                <div className="submission_format">
                    <div className="circle">
                        <svg className="check_logo" viewBox="0 0 24 24" aria-hidden="true">
                            <polyline points="5 12 10 17 19 7" />
                        </svg>
                    </div>
                    <h2 className="page_title">Listing posted!</h2>
                    <p className="submission_description">
                        Thank you for your donation. <strong>{listing.foodItem}</strong> is now listed for
                        pickup at {listing.address} on {pickupDate} from {formatTime(listing.pickupTime)} to {formatTime(listing.pickupEndTime)}.
                    </p>
                    <Link to="/donor-dashboard"><button className="upload_next_btn">Dashboard</button></Link>
                </div>
            </div>
        </UploadLayout>
    );
}

export default FoodSubmission
