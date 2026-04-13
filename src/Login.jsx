import "./Login.css";
import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Save current user to localStorage
            localStorage.setItem("currentUser", JSON.stringify(user));
            navigate("/CDashboard");
        } else {
            alert("Invalid email or password!");
        }
    };

    return(
        <div className="login_page">

            {/*Header */}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>

                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>
            </nav>

            {/*Login Card */}
            <div className="login_banner">
            <section className="login_card">
                <p className="login_label">Please Enter Your Name</p>
                <h2 className="login_header">Sign In</h2>
                <form className="login_info" onSubmit={handleLogin}>
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
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