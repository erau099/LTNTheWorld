import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UploadLayout from "./UploadLayout.jsx"
import { useFoodDraft, toggleValue, detailsError, clearFoodDraft, FOOD_TAGS, ALLERGENS } from "./foodDraft.js"

function UploadFoodDetails() {
    const navigate = useNavigate();
    const [draft, updateDraft] = useFoodDraft();
    const [error, setError] = useState(""); // State to hold and display error messages

    // Generic handler to update the draft based on input names
    const handleChange = (e) => {
        const { name, value } = e.target;
        updateDraft({ [name]: value });
        setError("");
    };

    const handleCancel = () => {
        clearFoodDraft();
        navigate("/donor-dashboard");
    };

    const handleNext = (e) => {
        e.preventDefault();
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
                <div className="upload_format">
                    <h2 className="page_title">Food Details</h2>
                    <label className="input_title" htmlFor="foodItem">Listing Title</label>
                    <input type="text" id="foodItem" name="foodItem" className="user_input"
                        maxLength={100} value={draft.foodItem} onChange={handleChange} />
                </div>

                <div className="upload_format">
                    <label className="input_title" htmlFor="description">Description</label>
                    <textarea id="description" name="description" className="user_input" rows={3}
                        maxLength={255} value={draft.description} onChange={handleChange} />
                </div>

                <div className="upload_format">
                    {/* Food condition: one choice, shown to recipients on their listings */}
                    <p className="input_title">Select the tag that describes your food item</p>
                    <div className="selection_form">
                        {FOOD_TAGS.map((tag) => (
                            <button type="button" key={tag}
                                className={draft.tags.includes(tag) ? "sel_btn_on" : "sel_btn_off"}
                                aria-pressed={draft.tags.includes(tag)}
                                onClick={() => { updateDraft({ tags: [tag] }); setError(""); }}>
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="upload_format">
                    <p className="input_title">Please select all applicable allergens</p>
                    <div className="selection_form">
                        {ALLERGENS.map((allergen) => (
                            <button type="button" key={allergen}
                                className={draft.allergens.includes(allergen) ? "sel_btn_on" : "sel_btn_off"}
                                aria-pressed={draft.allergens.includes(allergen)}
                                onClick={() => updateDraft({ allergens: toggleValue(draft.allergens, allergen) })}>
                                {allergen}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className="upload_error">{error}</p>}

                <div className="upload_nav_btn">
                    <button type="button" className="upload_cancel_btn" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="upload_next_btn">Next: Location & Time</button>
                </div>
            </form>
        </UploadLayout>
    );
}

export default UploadFoodDetails
