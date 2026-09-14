import "./WaiverSummary.css";

function WaiverSummary({ waiver, onViewWaiver }) {
    // If the user does not have a waiver record, do not render the summary section.
    if (!waiver) {
        return null;
    }

    // Convert the stored ISO timestamp into a readable local date/time.
    const signedDate = waiver.acceptedAt
        ? new Date(waiver.acceptedAt).toLocaleString()
        : "Not available";

    return (
        <div className="waiver_summary">
            {/* Displays the waiver title and current acceptance status */}
            <div className="waiver_summary_header">
                <h2>Waiver Information</h2>

                <span className="waiver_status">
                    {waiver.accepted ? "Accepted" : "Not Accepted"}
                </span>
            </div>

            {/* Read-only waiver metadata stored with the user's account */}
            <div className="waiver_summary_details">
                <div>
                    <span className="waiver_summary_label">
                        Signed
                    </span>

                    <p>{signedDate}</p>
                </div>

                <div>
                    <span className="waiver_summary_label">
                        Version
                    </span>

                    <p>{waiver.version || "Not available"}</p>
                </div>
            </div>

            {/* Opens the full read-only waiver details page */}
            <button
                type="button"
                className="waiver_view_btn"
                onClick={onViewWaiver}
            >
                View Signed Waiver
            </button>
        </div>
    );
}

export default WaiverSummary;