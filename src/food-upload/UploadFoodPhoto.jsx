import "./UploadFood.css"
import { Link } from "react-router-dom"

function UploadFoodPhoto({}) {
    return(
        <div className="upload_food_details">

            {/* Header */ }
            <nav className="nav">
                <span className="header_tittle">Lighten The World</span>

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
                        <p className="num_off">2</p>
                        <p className="num_text_off">Location & Time</p>
                        <p className="num_on">3</p>
                        <p className="num_text_on">Upload Photo</p>
                    </section>

                    <form className="upload_body">
                        <div className="upload_format">
                            <h2 className="page_title">Upload Photo</h2>
                            <div className="upload_square_box">
                                <p className="upload_title">Upload up to 3 photos of the food you are listing:</p>
                                <div className="upload_photo_btn">
                                    <button className="upload_next_btn">Upload Photos</button>
                                    <button className="upload_next_btn">Open Camera</button>
                                </div>
                            </div>
                        </div>

                        <div className="upload_nav_btn">
                            <Link to="/UploadFoodLocation"><button className="upload_cancel_btn">Back</button></Link>
                            <Link to="/FoodSubmission"><button className="upload_next_btn">Submit</button></Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UploadFoodPhoto