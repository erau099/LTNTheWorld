import "./Login.css";
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function Login({}) {
    // Store values
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [popup, setPopup] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const passwordReset = searchParams.get("reset") === "success"
    const checkEmail = searchParams.get("signup") === "check-email"
    const [resendMessage, setResendMessage] = useState('')

    // DT-332: send a new verification link to the email typed in the form
    const handleResendVerification = async () => {
        setResendMessage('')
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username })
            })
            setResendMessage(await response.text())
        } catch {
            setResendMessage('Could not connect to the server.')
        }
    }
    const { setUser } = useAuth()

    // Login function
    const handleLogin = async (e) =>{
        e.preventDefault()

        // Send data to springboot as JSON to /api/auth/login
        const response = await fetch ('/api/auth/login',{
            method: 'POST',
            headers: { 'Content-Type' : 'application/json'},
            credentials: 'include',
            body: JSON.stringify({username, password})
        })

        if(response.ok){
            const result = await response.json()
            // result contains status, name, role
            if(result.status === 'success'){
                setUser({
                    name: result.name,
                    role: result.role,
                    canPostListings: result.canPostListings
                })
                setPopup('success')

                // Determine destination based on role
                const destination = result.role === 'recipient' ? '/recipient-dashboard' : '/donor-dashboard'
                setTimeout(() => navigate(destination), 1500)
            } else {
                setPopup('error')
            }
        } else if (response.status === 403) {
            const text = await response.text().catch(() => '');
            if (text.toLowerCase().includes('verify your email')) {
                setResendMessage('')
                setPopup('unverified')
            } else if (text.toLowerCase().includes('suspended')) {
                setPopup('suspended')
            } else {
                setPopup('error')
            }
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
            {popup === 'unverified' && (
                <div className="popup error_popup">
                    📧 Please verify your email before signing in. Check your inbox for the link.
                    <button type="button" onClick={handleResendVerification}>Resend email</button>
                    <button onClick={() => setPopup('')}>✕</button>
                    {resendMessage && <div>{resendMessage}</div>}
                </div>
            )}
            {popup === 'suspended' && (
                <div className="popup error_popup">
                    ⛔ Account is suspended. Please contact support.
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
            {checkEmail && (
                <div className="popup success_popup">
                    ✅ Account created! Check your email for a verification link, then sign in.
                </div>
            )}
            {passwordReset && (
                <div className="popup success_popup">
                    ✅ Password reset successfully! You can now sign in.
                </div>
            )}
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

                    <Link to="/forgot-password">
                        Forgot Password?
                    </Link>

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
