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
                        <input type="text" className="user_input"></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title>">Description</p>
                        <input type="text" className="user_input"></input>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Select tags that describe your food item</p>
                        <div className="selection_form">
                            <button className="sel_btn_on">Fresh / Hot</button>
                            <button className="sel_btn_off">Canned</button>
                        </div>
                    </div>

                    <div className="upload_format">
                        <p className="input_title">Please select all applicable allergens</p>
                        <div className="selection_form">
                            <button className="sel_btn_on">Milk</button>
                            <button className="sel_btn_on">Eggs</button>
                            <button className="sel_btn_on">Fish</button>
                            <button className="sel_btn_on">Shellfish</button>
                            <button className="sel_btn_on">Peanuts</button>
                            <button className="sel_btn_on">Tree Nuts</button>
                            <button className="sel_btn_on">Soy</button>
                            <button className="sel_btn_on">Diary</button>
                            <button className="sel_btn_off">Wheat</button>
                        </div>
                    </div>

                    <div className="upload_nav_btn">
                        <button className="upload_cancel_btn">Cancel</button>
                        <button className="upload_next_btn">Next: Location & Time</button>
                    </div>
                </form>
            </div>
            </div>
        </div>


    );
}

export default UploadFoodDetails