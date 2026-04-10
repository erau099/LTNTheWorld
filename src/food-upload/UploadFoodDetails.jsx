import "./UploadFood.css"
import { Link } from "react-router-dom"

function UploadFoodDetails({}) {
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
            <div className="upload_banner">
                <section className="upload_header">
                    <p className="num1on">1</p>
                    <p className="num1texton">Food Details</p>
                    <p className="num2on">2</p>
                    <p className="num2texton">Location & Time</p>
                    <p className="num3on">3</p>
                    <p className="num3texton">Upload Photo</p>
                    <p className="num1off">1</p>
                    <p className="num1textoff">Food Details</p>
                    <p className="num2off">2</p>
                    <p className="num2textoff">Location & Time</p>
                    <p className="num3off">3</p>
                    <p className="num3textoff">Upload Photo</p>
                </section>
            </div>


        </div>


    );
}

export default UploadFoodDetails