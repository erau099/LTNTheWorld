import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import UploadLayout from "./UploadLayout.jsx"
import { apiFetch } from "../api.js"
import { useFoodDraft, detailsError, locationError, clearFoodDraft, resizePhoto, MAX_PHOTOS } from "./foodDraft.js"

function UploadFoodPhoto() {
    const navigate = useNavigate();
    const [draft, updateDraft] = useFoodDraft();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    // Earlier steps must be filled in first
    if (detailsError(draft)) {
        return <Navigate to="/UploadFoodDetails" replace />;
    }
    if (locationError(draft)) {
        return <Navigate to="/UploadFoodLocation" replace />;
    }

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
        e.target.value = ""; // allow picking the same file again
        if (files.length === 0) return;

        const room = MAX_PHOTOS - draft.photos.length;
        if (files.length > room) {
            setError(`You can upload up to ${MAX_PHOTOS} photos.`);
        } else {
            setError("");
        }

        try {
            const resized = await Promise.all(files.slice(0, room).map((f) => resizePhoto(f)));
            updateDraft({ photos: [...draft.photos, ...resized] });
        } catch {
            setError("One of the photos could not be read. Please try another image.");
        }
    };

    const removePhoto = (index) => {
        updateDraft({ photos: draft.photos.filter((_, i) => i !== index) });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const response = await apiFetch("/api/food", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    foodItem: draft.foodItem,
                    description: draft.description,
                    tags: draft.tags,
                    allergens: draft.allergens,
                    address: draft.address,
                    date: draft.date,
                    startTime: draft.startTime,
                    endTime: draft.endTime,
                    photos: draft.photos,
                }),
            });

            if (response.ok) {
                const listing = await response.json();
                clearFoodDraft();
                navigate("/FoodSubmission", { state: { listing } });
            } else if (response.status === 403) {
                setError("Only donor accounts can post food listings.");
            } else {
                const message = await response.text();
                setError(message || "Could not post your listing. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting food listing:", err);
            setError("Could not reach the server. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const full = draft.photos.length >= MAX_PHOTOS;

    return (
        <UploadLayout step={3}>
            <form className="upload_body" onSubmit={handleSubmit}>
                <div className="upload_format">
                    <h2 className="page_title">Upload Photo</h2>
                    <div className="upload_square_box">
                        <p className="upload_title">
                            Upload up to {MAX_PHOTOS} photos of the food you are listing (optional):
                        </p>

                        {draft.photos.length > 0 && (
                            <div className="photo_previews">
                                {draft.photos.map((photo, i) => (
                                    <div className="photo_preview" key={i}>
                                        <img src={photo} alt={`Food photo ${i + 1}`} />
                                        <button type="button" className="photo_remove_btn"
                                            aria-label={`Remove photo ${i + 1}`}
                                            onClick={() => removePhoto(i)}>
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="upload_photo_btn">
                            <button type="button" className="upload_next_btn" disabled={full}
                                onClick={() => fileInputRef.current.click()}>
                                Upload Photos
                            </button>
                            <button type="button" className="upload_next_btn" disabled={full}
                                onClick={() => cameraInputRef.current.click()}>
                                Open Camera
                            </button>
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                        {/* capture opens the camera on phones; desktops fall back to the file picker */}
                        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFiles} />
                    </div>
                </div>

                {error && <p className="upload_error">{error}</p>}

                <div className="upload_nav_btn">
                    <button type="button" className="upload_cancel_btn"
                        onClick={() => navigate("/UploadFoodLocation")}>
                        Back
                    </button>
                    <button type="submit" className="upload_next_btn" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </form>
        </UploadLayout>
    );
}

export default UploadFoodPhoto
