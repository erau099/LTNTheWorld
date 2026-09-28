import "./Login.css";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const passwordIsValid = (password) => {
        return (
            password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /[0-9]/.test(password) &&
            /[^A-Za-z0-9]/.test(password)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!token) {
            setError("Invalid password reset link.");
            return;
        }

        if (!passwordIsValid(newPassword)) {
            setError(
                "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                    confirmPassword
                })
            });

            const text = await response.text();

            if (response.ok) {
                navigate("/Login?reset=success");
            } else {
                setError(text || "Unable to reset password.");
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
                    <p className="login_label">Account Recovery</p>
                    <h2 className="login_header">Reset Password</h2>

                    {!token ? (
                        <>
                            <p>That password reset link is invalid.</p>

                            <Link to="/forgot-password">
                                Request another reset link
                            </Link>
                        </>
                    ) : (
                        <form
                            className="login_info"
                            onSubmit={handleSubmit}
                        >
                            <input
                                type="password"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) =>
                                    setNewPassword(e.target.value)
                                }
                                required
                            />

                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />

                            <p>
                                Password must be at least 8 characters
                                and include an uppercase letter,
                                lowercase letter, number, and special
                                character.
                            </p>

                            {error && (
                                <p className="error_message">
                                    {error}
                                </p>
                            )}

                            <button
                                className="submit_btn"
                                type="submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Resetting..."
                                    : "Reset Password"}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}

export default ResetPassword;