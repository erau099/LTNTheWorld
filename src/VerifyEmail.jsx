import "./Login.css";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

// DT-332: page the signup verification email links to (/#/verify-email?token=...)
function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    // Result of verifying a token, kept with the token it belongs to
    const [result, setResult] = useState({ token: null, ok: false, message: "" });
    const [email, setEmail] = useState("");
    const [resendMessage, setResendMessage] = useState("");
    const sentToken = useRef(null);

    let status = "verifying";
    let message = "";
    if (!token) {
        status = "error";
        message = "That verification link is invalid.";
    } else if (result.token === token) {
        status = result.ok ? "verified" : "error";
        message = result.message;
    }

    useEffect(() => {
        // React StrictMode runs effects twice in development, and a token only works once,
        // so send each token a single time
        if (!token || sentToken.current === token) return;
        sentToken.current = token;

        fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (response) => {
                const text = await response.text();
                setResult({
                    token,
                    ok: response.ok,
                    message: text || (response.ok ? "Your email has been verified." : "Unable to verify your email."),
                });
            })
            .catch(() => {
                setResult({ token, ok: false, message: "Could not connect to the server." });
            });
    }, [token]);

    const handleResend = async (e) => {
        e.preventDefault();
        setResendMessage("");
        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            setResendMessage(await response.text());
        } catch {
            setResendMessage("Could not connect to the server.");
        }
    };

    return (
        <div className="login_page">
            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>
            </nav>

            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Account Setup</p>
                    <h2 className="login_header">Verify Email</h2>

                    {status === "verifying" && <p>Verifying your email...</p>}

                    {status === "verified" && (
                        <>
                            <p>✅ {message}</p>
                            <Link to="/Login">
                                <button className="submit_btn" type="button">Go to Sign In</button>
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <p>❌ {message}</p>
                            <form className="login_info" onSubmit={handleResend}>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button className="submit_btn" type="submit">
                                    Send a new verification link
                                </button>
                            </form>
                            {resendMessage && <p>{resendMessage}</p>}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

export default VerifyEmail;
