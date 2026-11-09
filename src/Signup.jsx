import { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { createWaiverRecord } from "./utils/waiverService";
import WaiverText from "./Waivers/WaiverText.jsx";

function Signup() {
    const navigate = useNavigate();
    const [showWaiver, setShowWaiver] = useState(false);
    const [canAcceptWaiver, setCanAcceptWaiver] = useState(false);
    const [waiverChecked, setWaiverChecked] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        retypePassword: "",
        dob: "",
        phoneNumber: "",
        role: ""
    });

    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleWaiverScroll = (e) => {
        const el = e.target;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
            setCanAcceptWaiver(true);
        }
    };

    const handleWaiverAccept = () => {
        setWaiverChecked(true);
        setShowWaiver(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.retypePassword) {
            setError("Passwords do not match");
            return;
        }

        if (
            !formData.email ||
            !formData.password ||
            !formData.firstName ||
            !formData.lastName
        ) {
            setError("Please fill in all required fields");
            return;
        }
        
        if (!formData.role) {
            setError("Please select a role");
            return;
        }

        if (!waiverChecked) {
            setError("Please accept the liability waiver");
            return;
        }

        const waiver = createWaiverRecord();

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    dateOfBirth: formData.dob,
                    phoneNumber: formData.phoneNumber,
                    role: formData.role,
                    waiver
                })
            });

            if (response.ok) {
                navigate("/Login?signup=check-email");
            } else {
                const message = await response.text();
                setError(message);
            }
        } catch (err) {
            setError("Failed to connect to the server.");
        }
    };

    return (
        <div className="login_page">
            <nav className="nav">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span className="header_title">Love Thy Neighbor</span>
                </Link>

                <div className="header_links">
                    <Link to="/Login">
                        <button className="signupbtn">Login</button>
                    </Link>
                </div>
            </nav>

            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Join the Community</p>
                    <h2 className="login_header">Create Account</h2>

                    {error && (
                        <p
                            className="error_message"
                            style={{
                                color: "#9b1c1c",
                                background: "#fde8e8",
                                padding: "10px",
                                borderRadius: "8px",
                                fontSize: "0.9rem",
                                textAlign: "center",
                                margin: "0 0 16px 0"
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <form className="login_info" onSubmit={handleSubmit}>
                        <div className="create_col">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        <input
                            type="password"
                            name="retypePassword"
                            placeholder="Retype Password"
                            value={formData.retypePassword}
                            onChange={handleChange}
                            required
                        />

                        <div className="create_col">
                            <input
                                type="date"
                                name="dob"
                                placeholder="DOB: MM/DD/YYYY"
                                value={formData.dob}
                                onChange={handleChange}
                            />
                            <input
                                type="text"
                                name="phoneNumber"
                                placeholder="Phone Number"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <select
                            className="select_role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Role</option>
                            <option value="donor">Donor</option>
                            <option value="recipient">Recipient</option>
                        </select>

                        <div className="waiver_checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={waiverChecked}
                                    disabled={!canAcceptWaiver}
                                    onChange={(e) => setWaiverChecked(e.target.checked)}
                                />
                                <span>
                                    I have read and agree to the{" "}
                                    <span
                                        className="waiver_link"
                                        onClick={() => setShowWaiver(true)}
                                    >
                                        liability waiver
                                    </span>
                                </span>
                            </label>

                            <p className="waiver_helper_text">
                                Please review the waiver before continuing.
                            </p>
                        </div>

                        <div className="continue_btn">
                            <button
                                type="submit"
                                className="submit_btn"
                                disabled={!waiverChecked}
                            >
                                Continue
                            </button>
                        </div>
                    </form>

                    <div className="center_cancel_btn">
                        <Link to="/">
                            <button className="cancel_btn">Cancel</button>
                        </Link>
                    </div>
                </section>
            </div>

            {showWaiver && (
                <div className="waiver_modal" onClick={() => setShowWaiver(false)}>
                    <div className="waiver_content" onClick={(e) => e.stopPropagation()}>
                        <h3>Liability Waiver</h3>
                        <p className="waiver_intro_text">
                            Scroll to the bottom of the waiver to enable acceptance.
                        </p>

                        <div
                            className="waiver_box"
                            onScroll={handleWaiverScroll}
                        >
                            <WaiverText />
                        </div>

                        <button
                            className="submit_btn"
                            disabled={!canAcceptWaiver}
                            onClick={handleWaiverAccept}
                        >
                            Accept
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Signup;