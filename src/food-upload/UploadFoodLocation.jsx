import "./UploadFood.css"
import { Link } from "react-router-dom"

function UploadFoodLocation({}) {
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
                        <input type="text" className="user_input"></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title>">Date</p>
                        <input type="text" className="user_input"></input>
                    </div>

                    <div className="time_format">
                        <p className="input_title">Time Start</p>
                        <p className="input_title">Time End</p>
                        <input type="time" id="meeting_start" name="meeting_end" required/>
                        <input type="time" id="meeting_end" name="meeting_end" required/>
                    </div>


                    <div className="upload_nav_btn">
                        <button className="upload_cancel_btn">Back</button>
                        <Link to="/UploadFoodLocation"><button className="upload_next_btn">Upload Photo</button></Link>
                    </div>
                </form>
            </div>
            </div>
        </div>
    )

}

export default UploadFoodLocation