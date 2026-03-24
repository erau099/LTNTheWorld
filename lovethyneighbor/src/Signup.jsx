import "./Login.css";

function Signup({}) {
    return(
        <div className="login_page">

            {/*Header*/}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>

                <div className="header_links">
                    <button className="signupbtn"onClick={() => setCurrentPage("signup")}>Sign Up</button>
                </div>
            </nav>

            {/*Sign Up Card */}
            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Please Enter Your Details</p>
                    <h2 className="login_header">Create Account</h2>

                    <form className="login_info">
                        <div className="create_col">
                            <input type="first_name" placeholder="First Name"></input>
                            <input type="last_name" placeholder="Last Name"></input>
                        </div>
                        <input type="email_address" placeholder="Email Address"></input>
                        <input type="password" placeholder="Password"></input>
                        <input type="retype_password" placeholder="Retype Password"></input>
                        <div className="create_col">
                            <input type="dob" placeholder="DOB: MM/DD/YYYY"></input>
                            <input type="phone_num" placeholder="Phone Number"></input>
                        </div>
                        <select className="select_role">
                            <option valule="select_role">Select Role</option>
                            <option value="donor">Donor</option>
                            <option value="recipient">Recipient</option>
                        </select>
                    </form>

                    <div className="continue_btn">
                        <button className="submit_btn">Continue</button>
                    </div>
                    
                    <div className="center_cancel_btn">
                        <button className="cancel_btn">Cancel</button>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Signup;