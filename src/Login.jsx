import "./Login.css";
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [popup, setPopup] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const passwordReset = searchParams.get("reset") === "success";
    const checkEmail = searchParams.get("signup") === "check-email";
    const [resendMessage, setResendMessage] = useState('');

    const handleResendVerification = async () => {
        setResendMessage('');
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username })
            });
            setResendMessage(await response.text());
        } catch {
            setResendMessage('Could not connect to the server.');
        }
    };
    
    const { setUser } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.status === 'success') {
                setUser({
                    name: result.name,
                    role: result.role,
                    canPostListings: result.canPostListings
                });
                setPopup('success');

                const destination = result.role === 'recipient' ? '/recipient-dashboard' : '/donor-dashboard';
                setTimeout(() => navigate(destination), 1500);
            } else {
                setPopup('error');
            }
        } else if (response.status === 403) {
            const text = await response.text().catch(() => '');
            if (text.toLowerCase().includes('verify your email')) {
                setResendMessage('');
                setPopup('unverified');
            } else if (text.toLowerCase().includes('suspended')) {
                setPopup('suspended');
            } else {
                setPopup('error');
            }
        } else {
            setPopup('error');
        }
    };

    return (
        <div className="login_page">
            {popup === 'success' && (
                <div className="popup success_popup">
                    ✅ Signed in successfully! Redirecting...
                </div>
            )}
            {popup === 'error' && (
                <div className="popup error_popup">
                    <span>❌ Incorrect username or password.</span>
                    <button onClick={() => setPopup('')}>✕</button>
                </div>
            )}
            {popup === 'unverified' && (
                <div className="popup error_popup">
                    <span>📧 Please verify your email before signing in. Check your inbox for the link.</span>
                    <button type="button" onClick={handleResendVerification}>Resend email</button>
                    <button onClick={() => setPopup('')}>✕</button>
                    {resendMessage && <div>{resendMessage}</div>}
                </div>
            )}
            {popup === 'suspended' && (
                <div className="popup error_popup">
                    <span>⛔ Account is suspended. Please contact support.</span>
                    <button onClick={() => setPopup('')}>✕</button>
                </div>
            )}

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

            {/* Header */}
            <nav className="nav">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="header_title">Love Thy Neighbor</span>
                </Link>

                <div className="header_links">
                    <Link to="/Signup"><button className="signupbtn">Sign Up</button></Link>
                </div>
            </nav>

            {/* Login Card */}
            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Welcome Back</p>
                    <h2 className="login_header">Sign In</h2>

                    <form className="login_info" onSubmit={handleLogin}>
                        <input
                            type="text"
                            placeholder="Email Address"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        <Link to="/forgot-password" className="forgot_password_link">
                            Forgot Password?
                        </Link>

                        <button className="submit_btn" type="submit">Sign In</button>
                    </form>

                    <p className="not_registered">
                        Not registered? <Link to="/Signup">Create an account</Link>
                    </p>

                    <div className="center_cancel_btn">
                        <Link to="/"><button className="cancel_btn">Cancel</button></Link>
                    </div>
                </section>
            </div>
        </div>    
    );
}

export default Login;