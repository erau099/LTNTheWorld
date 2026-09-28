import "./UploadFood.css"
import { Link } from "react-router-dom"

function FoodSubmission ({}) {
    return(
        <div className="upload_food_details">

            {/* Header */}
            <nav className="nav">
                <span className="header_tittle">Lighten The World</span>

                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>
            </nav>

            { /*Upload Food Card*/ }
            <div className="upload_card">
                <div className="upload_banner">
                    <section className="upload_header">
                        <p className="num_text_on">Submitted</p>
                    </section>

                    <form className="upload_body">
                        <div className="upload_format">
                            <div className="submission_format">
                                <div className="circle">
                                </div>
                                <p className="submission_description">Thank you for your submission. Posted are blank blank blank.....</p>
                                <Link to="/"><button className="upload_next_btn">Dashboard</button></Link>
                                
                            </div>
                            
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default FoodSubmission