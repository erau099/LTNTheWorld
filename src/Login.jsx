import "./Login.css";
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom";

function Login({}) {
    return(
        <div className="login_page">

            {/*Header */}
            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>

                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>
            </nav>

            {/*Login Card */}
            <div className="login_banner">
            <section className="login_card">
                <p className="login_label">Please Enter Your Name</p>
                <h2 className="login_header">Sign In</h2>
                <form className="login_info">
                    <input type="email_address" placeholder="Email Address"></input>
                    <input type="password" placeholder="Password"></input>
                    <button className="submit_btn">Sign In</button>
                </form>
                <p className="not_registered">Not Registered?</p>
                <div className="center_cancel_btn">
                    <Link to="/"><button className="cancel_btn">Cancel</button></Link>
                </div>
            </section>
            </div>
        </div>    
    );
}

export default Login