import { useState } from "react";
import "./UploadFood.css"
import { Link, useNavigate } from "react-router-dom"

function UploadFoodLocation() {
    //Form data for the food location form
    const [formData, setFormData] = useState({
        location: "",
        date: "",
        timeStart: "",
        timeEnd: "",
    });

    const [error, setError] = useState("");

    // Generic handler to update form based on input names for food location form
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleSubmitLocation = (e) => {
        e.preventDefault();
        setError("");

        if(
            !formData.location ||
            !formData.date ||
            !formData.timeStart ||
            !formData.timeEnd
        ) {
            setError("Please set up food location before proceeding.");
            return;
        }

        // Get the food details saved during step 1
        const savedDraft = JSON.parse(
            sessionStorage.getItem("foodListingDraft") || "{}"
        );

        // Add the location and time information to the same listing draft
        const updatedDraft = {
            ...savedDraft,
            ...formData
        };

        sessionStorage.setItem(
            "foodListingDraft",
            JSON.stringify(updatedDraft)
        );

        navigate("/UploadFoodPhoto");
    };

    const navigate = useNavigate();

    return(
        <div className="upload_food_details">

            {/*Header*/}
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
                    <p className="num_off">1</p>
                    <p className="num_text_off">Food Details</p>
                    <p className="num_on">2</p>
                    <p className="num_text_on">Location & Time</p>
                    <p className="num_off">3</p>
                    <p className="num_text_off">Upload Photo</p>
                </section>

                <form className="upload_body">
                    <div className="upload_format">
                        <h2 className="page_title">Location</h2>
                        <p className="input_title">Address</p>
                        <input
                            type="text"
                            className="user_input"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Date</p>
                        <input
                            type="date"
                            className="user_input"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        ></input>
                    </div>

                    <div className="time_format">
                        <p className="input_title">Time Start</p>
                        <p className="input_title">Time End</p>

                        <input
                            type="time"
                            name="timeStart"
                            value={formData.timeStart}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="time"
                            name="timeEnd"
                            value={formData.timeEnd}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p>{error}</p>}

                    <div className="upload_nav_btn">
                        <button
                            type="button"
                            className="upload_cancel_btn"
                            onClick={() => navigate("/UploadFoodDetails")}
                        >
                            Back
                        </button>

                        <button
                            type="button"
                            className="upload_next_btn"
                            onClick={handleSubmitLocation}
                        >
                            Next: Upload Photo
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    )
}

export default UploadFoodLocation
