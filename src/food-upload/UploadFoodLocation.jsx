import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import UploadLayout from "./UploadLayout.jsx"
import { useFoodDraft, detailsError, locationError, todayString } from "./foodDraft.js"

function UploadFoodLocation() {
    const navigate = useNavigate();
    const [draft, updateDraft] = useFoodDraft();
    const [error, setError] = useState("");

    // Details must be filled in first
    if (detailsError(draft)) {
        return <Navigate to="/UploadFoodDetails" replace />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateDraft({ [name]: value });
        setError("");
    };

    const handleNext = (e) => {
        e.preventDefault();
        const message = locationError(draft);
        if (message) {
            setError(message);
            return;
        }
        navigate("/UploadFoodPhoto");
    };

    return (
        <UploadLayout step={2}>
            <form className="upload_body" onSubmit={handleNext}>
                <div className="upload_format">
                    <h2 className="page_title">Location</h2>
                    <label className="input_title" htmlFor="address">Pickup Address</label>
                    <input type="text" id="address" name="address" className="user_input"
                        maxLength={255} value={draft.address} onChange={handleChange} />
                </div>

                <div className="upload_format">
                    <label className="input_title" htmlFor="date">Date</label>
                    <input type="date" id="date" name="date" className="user_input"
                        min={todayString()} value={draft.date} onChange={handleChange} />
                </div>

                <div className="time_format">
                    <div>
                        <label className="input_title" htmlFor="startTime">Time Start</label>
                        <input type="time" id="startTime" name="startTime" className="user_input"
                            value={draft.startTime} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="input_title" htmlFor="endTime">Time End</label>
                        <input type="time" id="endTime" name="endTime" className="user_input"
                            value={draft.endTime} onChange={handleChange} />
                    </div>
                </div>

                {error && <p className="upload_error">{error}</p>}

                <div className="upload_nav_btn">
                    <button type="button" className="upload_cancel_btn"
                        onClick={() => navigate("/UploadFoodDetails")}>
                        Back
                    </button>
                    <button type="submit" className="upload_next_btn">Next: Upload Photo</button>
                </div>
            </form>
        </UploadLayout>
    );
}

export default UploadFoodLocation
