import "./Login.css";
import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for redirection after login
import { login } from "./utils/auth"; // Imported local auth utility for credential verification

function Login() {
    const navigate = useNavigate(); // Hook to programmatically navigate between pages
    const [email, setEmail] = useState(""); // State for email input field
    const [password, setPassword] = useState(""); // State for password input field
    const [error, setError] = useState(""); // State to store and display login errors

    // Form submission handler to process login request
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default browser form refresh
        setError(""); // Clear previous error messages

        // Attempt login via the temporary auth utility
        const result = login(email, password);
        if (result.success) {
            navigate("/Dashboard"); // Redirect to dashboard on successful login
        } else {
            setError(result.message); // Show error message if credentials fail
        }
    };

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
                    
                    {/* Display login error messages here */}
                    {error && <p className="error_message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}

                    {/* Added onSubmit handler to form element */}
                    <form className="login_info" onSubmit={handleSubmit}>
                        {/* Added value and onChange to make email input controlled */}
                        <input 
                            type="email" 
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {/* Added value and onChange to make password input controlled */}
                        <input 
                            type="password" 
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {/* Changed to submit type to trigger handleSubmit */}
                        <button type="submit" className="submit_btn">Sign In</button>
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
