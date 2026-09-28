import "./Login.css";
import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const text = await response.text();

            if (response.ok) {
                setMessage(
                    "If an account exists with that email, a password reset link has been sent."
                );
            } else {
                setError(text || "Unable to send reset link.");
            }
        } catch (err) {
            setError("Could not connect to the server.");
        }

        setLoading(false);
    };

    return (
        <div className="login_page">
            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>
            </nav>

            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Password Recovery</p>
                    <h2 className="login_header">Forgot Password</h2>

                    <p>
                        Enter your email and we will send you a password reset link.
                    </p>

                    <form className="login_info" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button
                            className="submit_btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>

                    {message && (
                        <p className="success_message">{message}</p>
                    )}

                    {error && (
                        <p className="error_message">{error}</p>
                    )}

                    <div className="center_cancel_btn">
                        <Link to="/Login">
                            <button className="cancel_btn">
                                Back to Login
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ForgotPassword;