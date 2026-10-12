import { useState } from "react";
import "./UploadFood.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function UploadFoodDetails() {
    const { user } = useAuth();
    const isRestricted = user?.canPostListings === false;
    const navigate = useNavigate();

    //Form data for the food details form
    const [formData, setFormData] = useState({
        listingTitle: "",
        description: "",
        tag: "",
        allergens: "",
    });
    
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
        setError("");

        if (isRestricted) {
            setError("Your ability to post listings has been restricted by an administrator.");
            return;
        }

        //checking if all required fields are filled before submission
        if(
            !formData.listingTitle ||
            !formData.description ||
            !formData.tag ||
            !formData.allergens
            
        ) {
            setError("Please set up food details before proceeding."); 
            return;
        }
        try {
            const response = await fetch('/api/food', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    foodItem: formData.listingTitle,
                    description: formData.description,
                    tags: formData.tag,
                    allergens: formData.allergens,
                    status: 'ACTIVE'
                }),
            });
            if(response.ok){
                alert("Food details submitted successfully!");
                navigate("/DonorDashboard");
            } else {
                const message = await response.json();
                setError(message);
            }
        } catch (error) {
            console.error("Error submitting food details:", error);
        }
    }

    return (
        <div className="upload_food_details">
            {/* Header */}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>
                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>

            {/*Upload Food Card*/}
            <div className="upload_card">
                <div className="upload_banner">
                <section className="upload_header">
                    <p className="num_on">1</p>
                    <p className="num_text_on">Food Details</p>
                    <p className="num_off">2</p>
                    <p className="num_text_off">Location & Time</p>
                    <p className="num_off">3</p>
                    <p className="num_text_off">Upload Photo</p>
                </section>

                <form className="upload_body">
                    {isRestricted && (
                        <div style={{
                            backgroundColor: "#fee2e2",
                            border: "1px solid #ef4444",
                            color: "#991b1b",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            marginBottom: "16px",
                            fontWeight: "600",
                            textAlign: "center"
                        }}>
                            ⚠️ Your ability to post listings has been restricted by an administrator.
                        </div>
                    )}

                    {error && (
                        <div style={{
                            backgroundColor: "#fef3c7",
                            border: "1px solid #f59e0b",
                            color: "#92400e",
                            padding: "10px 14px",
                            borderRadius: "6px",
                            marginBottom: "14px",
                            textAlign: "center"
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="upload_format">
                        <h2 className="page_title">Food Details</h2>
                        <p className="input_title">Listing Title</p>
                        <input type="text" 
                        name="listingTitle"
                        className="user_input"
                        value={formData.listingTitle}
                        onChange={handleChange}
                        disabled={isRestricted}
                        required
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Description</p>
                        <input type="text" 
                        name="description"
                        className="user_input"
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isRestricted}
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Select tags that describe your food item</p>
                        <div className="selection_form">
                            <button type="button" className="sel_btn_on" disabled={isRestricted}>Fresh / Hot</button>
                            <button type="button" className="sel_btn_off" disabled={isRestricted}>Canned</button>
                        </div>
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
