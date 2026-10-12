import { useState } from "react";
import "./UploadFood.css"
import { Link, useNavigate } from "react-router-dom"

function UploadFoodDetails() {
    //Form data for the food details form
    const [formData, setFormData] = useState({
        listingTitle: '',
        description: '',
        tag: '',
        allergens: '',
    });
    
    const [error, setError] = useState(""); // State to hold and display error messages

    // Generic handler to update form based on input names for food details form 
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev => ({...prev, [name]: value})));
    };

    // Saves the selected food condition
    const handleTagSelect = (tag) => {
        setFormData((prev) => ({
            ...prev,
            tag: tag
        }));
    };

    // Adds or removes allergens from the listing
    const handleAllergenToggle = (allergen) => {
        const currentAllergens = formData.allergens
            ? formData.allergens.split(",").map((item) => item.trim())
            : [];

        const updatedAllergens = currentAllergens.includes(allergen)
            ? currentAllergens.filter((item) => item !== allergen)
            : [...currentAllergens, allergen];

        setFormData((prev) => ({
            ...prev,
            allergens: updatedAllergens.join(", ")
        }));
    };

    // Checks whether an allergen is currently selected
    const isAllergenSelected = (allergen) => {
        return formData.allergens
            .split(",")
            .map((item) => item.trim())
            .includes(allergen);
    };

    //handling submission for food details form
    const handleSubmitDetails = (e) => {
        e.preventDefault();
        setError("");

        //checking if all required fields are filled before submission
        if(
            !formData.listingTitle ||
            !formData.description ||
            !formData.tag 
            
        ) {
            setError("Please set up food details before proceeding."); 
            return;
        }

        // Store step 1 so the remaining upload pages can use the same listing
        sessionStorage.setItem("foodListingDraft", JSON.stringify(formData));

        navigate("/UploadFoodLocation");
    };

    const navigate = useNavigate();

    return(
        <div className="upload_food_details">

            {/* Header */}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>

                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>
            </nav>

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

                    <div className="upload_format">
                        <h2 className="page_title">Food Details</h2>
                        <p className="input_title">Listing Title</p>
                        <input type="text" 
                        className="user_input"
                        name="listingTitle"
                        value={formData.listingTitle}
                        onChange={handleChange}
                        required
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title>">Description</p>
                        <input type="text" 
                        className="user_input"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Select tags that describe your food item</p>
                        <div className="selection_form">
                            <button
                                type="button"
                                className={formData.tag === "Fresh / Hot" ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleTagSelect("Fresh / Hot")}
                            >
                                Fresh / Hot
                            </button>

                            <button
                                type="button"
                                className={formData.tag === "Canned" ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleTagSelect("Canned")}
                            >
                                Canned
                            </button>
                        </div>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Please select all applicable allergens</p>
                        <div className="selection_form">
                            <button
                                type="button"
                                className={isAllergenSelected("Milk") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Milk")}
                            >
                                Milk
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Eggs") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Eggs")}
                            >
                                Eggs
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Fish") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Fish")}
                            >
                                Fish
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Shellfish") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Shellfish")}
                            >
                                Shellfish
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Peanuts") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Peanuts")}
                            >
                                Peanuts
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Tree Nuts") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Tree Nuts")}
                            >
                                Tree Nuts
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Soy") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Soy")}
                            >
                                Soy
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Diary") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Diary")}
                            >
                                Diary
                            </button>

                            <button
                                type="button"
                                className={isAllergenSelected("Wheat") ? "sel_btn_on" : "sel_btn_off"}
                                onClick={() => handleAllergenToggle("Wheat")}
                            >
                                Wheat
                            </button>
                        </div>
                    </div>

                    {error && <p>{error}</p>}

                    <div className="upload_nav_btn">
                        <button
                            type="button"
                            className="upload_cancel_btn" 
                            onClick={() => navigate("/donor-dashboard")}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="upload_next_btn"
                            onClick={handleSubmitDetails}
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

export default UploadFoodDetails