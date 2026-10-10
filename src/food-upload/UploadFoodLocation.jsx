import "./UploadFood.css"
import { Link } from "react-router-dom"

function UploadFoodLocation({}) {
    //Form data for the food location form
    const [formData, setFormData] = useState({
        location: "",
        date: "",
        time: "",
    });

    // Generic handler to update form based on input names for food location form
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev => ({...prev, [name]: value})));
    };

    const handleSubmitLocation = async (e) => {
        e.preventDefault();
        if(
            !formData.location ||
            !formData.date ||
            !formData.timeStart ||
            !formData.timeEnd
        ) {
            setError("Please set up food location before proceeding.");
            return;
        }
        try {
            const response = await fetch('api/auth/food', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    location:formData.location,
                    date:formData.date,
                    timeStart:formData.timeStart,
                    timeEnd:formData.timeEnd
                }),
            });
            if(response.ok){
                setError("Food location submitted successfully!");
            } else {
                const message = await response.json();
                setError(message);
            }
        } catch (error) {
            console.error("Error submitting food location:", error);
        }
    }

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
                        <input type="text" 
                        className="user_input"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        ></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title>">Date</p>
                        <input type="text" 
                        className="user_input"
                        value={formData.date}
                        onChange={handleChange}
                        required>
                        </input>
                    </div>

                    <div className="time_format">
                        <p className="input_title">Time Start</p>
                        <p className="input_title">Time End</p>
                        <input type="time" id="meeting_start" name="meeting_end" required/>
                        <input type="time" id="meeting_end" name="meeting_end" required/>
                    </div>


                    <div className="upload_nav_btn">
                        <Link to="/UploadFoodDetails"><button className="upload_cancel_btn">Back</button></Link>
                        <Link to="/UploadFoodPhoto"><button className="upload_next_btn" onClick={handleSubmitLocation}>
                            Next:Upload Photo</button></Link>
                    </div>
                </form>
            </div>
            </div>
        </div>
    )

}

export default UploadFoodLocation