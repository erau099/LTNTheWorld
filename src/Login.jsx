import "./Login.css";
import { useState, useEffect } from 'react'
import { Link, useNavigate } from "react-router-dom";

function Login({}) {
    // Store values
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [popup, setPopup] = useState('')
    const navigate = useNavigate()

    // Login function
    const handleLogin = async (e) =>{
        e.preventDefault()

        // Send data to springboot as JSON to /api/auth/login
        const response = await fetch ('/api/auth/login',{
            method: 'POST',
            headers: { 'Content-Type' : 'application/json'},
            body: JSON.stringify({username, password})
        })

        const result = await response.text()

        // Java returns either success or failure
        if(result == 'success'){
            setPopup('success')
            setTimeout(() => navigate('/'), 1500)
        } else{
            setPopup('error')
        }
    }

    return(
        <div className="login_page">
            {/* Popup only shows when popup is set to either success or error*/}
            {popup === 'success' && (
                <div className="popup success_popup">
                    ✅ Signed in successfully! Redirecting...
                </div>
            )}
            {popup === 'error' && (
                <div className="popup error_popup">
                    ❌ Incorrect username or password.
                    <button onClick={() => setPopup('')}>✕</button>
                </div>
            )}

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

                {/*Submit form*/}
                <form className="login_info" onSubmit = {handleLogin}>
                    {/*Store texts*/}
                    <input
                        type = "text"
                        placeholder = "Email Address"
                        value = {username}
                        onChange = {e => setUsername(e.target.value)}
                    />
                    <input
                        type = "password"
                        placeholder = "Password"
                        value = {password}
                        onChange = {e => setPassword(e.target.value)}
                    />


                    <button className="submit_btn" type="submit">Sign In</button>
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
