
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UploadLayout from "./UploadLayout.jsx";
import {
    useFoodDraft,
    toggleValue,
    detailsError,
    clearFoodDraft,
    FOOD_TAGS,
    ALLERGENS,
} from "./foodDraft.js";

function UploadFoodDetails() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Check whether an administrator has restricted posting.
    const isRestricted = user?.canPostListings === false;

    // Shared draft used across the three upload pages.
    const [draft, updateDraft] = useFoodDraft();
    const [error, setError] = useState("");

    // Update form fields.
    const handleChange = (e) => {
        if (isRestricted) return;

        const { name, value } = e.target;
        updateDraft({ [name]: value });
        setError("");
    };

    // Cancel the upload and clear the saved draft.
    const handleCancel = () => {
        clearFoodDraft();
        navigate("/donor-dashboard");
    };

    // Validate details before proceeding.
    const handleNext = (e) => {
        e.preventDefault();

        if (isRestricted) {
            setError(
                "Your ability to post listings has been restricted by an administrator."
            );
            return;
        }

        const message = detailsError(draft);

        if (message) {
            setError(message);
            return;
        }

        navigate("/UploadFoodLocation");
    };

    return (
        <UploadLayout step={1}>
            <form className="upload_body" onSubmit={handleNext}>

                {isRestricted && (
                    <div
                        style={{
                            backgroundColor: "#fee2e2",
                            border: "1px solid #ef4444",
                            color: "#991b1b",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            fontWeight: "600",
                            textAlign: "center",
                        }}
                    >
                        ⚠️ Your ability to post listings has been
                        restricted by an administrator.
                    </div>
                )}

                <div className="upload_format">
                    <h2 className="page_title">Food Details</h2>

                    <label
                        className="input_title"
                        htmlFor="foodItem"
                    >
                        Listing Title
                    </label>

                    <input
                        type="text"
                        id="foodItem"
                        name="foodItem"
                        className="user_input"
                        maxLength={100}
                        value={draft.foodItem}
                        onChange={handleChange}
                        disabled={isRestricted}
                        required
                    />
                </div>

                <div className="upload_format">
                    <label
                        className="input_title"
                        htmlFor="description"
                    >
                        Description
                    </label>

                    <textarea
                        id="description"
                        name="description"
                        className="user_input"
                        rows={3}
                        maxLength={255}
                        value={draft.description}
                        onChange={handleChange}
                        disabled={isRestricted}
                        required
                    />
                </div>

                <div className="upload_format">
                    <p className="input_title">
                        Select the tag that describes your food item
                    </p>

                    <div className="selection_form">
                        {FOOD_TAGS.map((tag) => (
                            <button
                                type="button"
                                key={tag}
                                className={
                                    draft.tags.includes(tag)
                                        ? "sel_btn_on"
                                        : "sel_btn_off"
                                }
                                aria-pressed={draft.tags.includes(tag)}
                                onClick={() => {
                                    if (isRestricted) return;

                                    updateDraft({ tags: [tag] });
                                    setError("");
                                }}
                                disabled={isRestricted}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="upload_format">
                    <p className="input_title">
                        Please select all applicable allergens
                    </p>

                    <div className="selection_form">
                        {ALLERGENS.map((allergen) => (
                            <button
                                type="button"
                                key={allergen}
                                className={
                                    draft.allergens.includes(allergen)
                                        ? "sel_btn_on"
                                        : "sel_btn_off"
                                }
                                aria-pressed={
                                    draft.allergens.includes(allergen)
                                }
                                onClick={() => {
                                    if (isRestricted) return;

                                    updateDraft({
                                        allergens: toggleValue(
                                            draft.allergens,
                                            allergen
                                        ),
                                    });
                                }}
                                disabled={isRestricted}
                            >
                                {allergen}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <p className="upload_error">
                        {error}
                    </p>
                )}

                <div className="upload_nav_btn">
                    <button
                        type="button"
                        className="upload_cancel_btn"
                        onClick={handleCancel}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="upload_next_btn"
                        disabled={isRestricted}
                        style={
                            isRestricted
                                ? {
                                      opacity: 0.5,
                                      cursor: "not-allowed",
                                  }
                                : {}
                        }
                    >
                        Next: Location & Time
                    </button>
                </div>

            </form>
        </UploadLayout>
    );
}

export default UploadFoodDetails;
