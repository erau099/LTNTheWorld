
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./UploadFood.css";

function UploadFoodDetails() {
    const { user } = useAuth();
    const isRestricted = user?.canPostListings === false;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        listingTitle: "",
        description: "",
        tag: "",
        allergens: "",
    });

    const [error, setError] = useState("");

    // Update form fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Select food category
    const handleTagSelect = (tag) => {
        if (isRestricted) return;

        setFormData((prev) => ({
            ...prev,
            tag,
        }));
    };

    // Add or remove allergens
    const handleAllergenToggle = (allergen) => {
        if (isRestricted) return;

        const currentAllergens = formData.allergens
            ? formData.allergens.split(",").map((item) => item.trim())
            : [];

        const updatedAllergens = currentAllergens.includes(allergen)
            ? currentAllergens.filter((item) => item !== allergen)
            : [...currentAllergens, allergen];

        setFormData((prev) => ({
            ...prev,
            allergens: updatedAllergens.join(", "),
        }));
    };

    const isAllergenSelected = (allergen) => {
        return formData.allergens
            .split(",")
            .map((item) => item.trim())
            .includes(allergen);
    };

    // Validate and continue to the next upload step
    const handleSubmitDetails = (e) => {
        e.preventDefault();
        setError("");

        if (isRestricted) {
            setError(
                "Your ability to post listings has been restricted by an administrator."
            );
            return;
        }

        if (
            !formData.listingTitle.trim() ||
            !formData.description.trim() ||
            !formData.tag
        ) {
            setError("Please set up food details before proceeding.");
            return;
        }

        // Save details for the next upload page
        sessionStorage.setItem(
            "foodListingDraft",
            JSON.stringify(formData)
        );

        navigate("/UploadFoodLocation");
    };

    const allergens = [
        "Milk",
        "Eggs",
        "Fish",
        "Shellfish",
        "Peanuts",
        "Tree Nuts",
        "Soy",
        "Dairy",
        "Wheat",
    ];

    return (
        <div className="upload_food_details">
            {/* Header */}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>
                <div className="header_links">
                    <Link to="/Signup">
                        <button className="signupbtn">Sign Up</button>
                    </Link>
                </div>
            </nav>

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

                    <form
                        className="upload_body"
                        onSubmit={handleSubmitDetails}
                    >
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

                        {error && (
                            <div
                                style={{
                                    backgroundColor: "#fef3c7",
                                    border: "1px solid #f59e0b",
                                    color: "#92400e",
                                    padding: "10px 14px",
                                    borderRadius: "6px",
                                    marginBottom: "14px",
                                    textAlign: "center",
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="upload_format">
                            <h2 className="page_title">Food Details</h2>
                            <p className="input_title">Listing Title</p>
                            <input
                                type="text"
                                name="listingTitle"
                                className="user_input"
                                value={formData.listingTitle}
                                onChange={handleChange}
                                disabled={isRestricted}
                                required
                            />
                        </div>

                        <div className="upload_format">
                            <p className="input_title">Description</p>
                            <input
                                type="text"
                                name="description"
                                className="user_input"
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isRestricted}
                                required
                            />
                        </div>

                        <div className="upload_format">
                            <p className="input_title">
                                Select tags that describe your food item
                            </p>

                            <div className="selection_form">
                                {["Fresh / Hot", "Canned"].map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        className={
                                            formData.tag === tag
                                                ? "sel_btn_on"
                                                : "sel_btn_off"
                                        }
                                        onClick={() => handleTagSelect(tag)}
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
                                {allergens.map((allergen) => (
                                    <button
                                        key={allergen}
                                        type="button"
                                        className={
                                            isAllergenSelected(allergen)
                                                ? "sel_btn_on"
                                                : "sel_btn_off"
                                        }
                                        onClick={() =>
                                            handleAllergenToggle(allergen)
                                        }
                                        disabled={isRestricted}
                                    >
                                        {allergen}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="upload_nav_btn">
                            <button
                                type="button"
                                className="upload_cancel_btn"
                                onClick={() =>
                                    navigate("/donor-dashboard")
                                }
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
                </div>
            </div>
        </div>
    );
}

export default UploadFoodDetails;
