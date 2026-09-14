import { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
import { createWaiverRecord } from "./utils/waiverService";
import WaiverText from "./Waivers/WaiverText.jsx";

function Signup() {
    const navigate = useNavigate(); // Hook to programmatically navigate between pages
    const [showWaiver, setShowWaiver] = useState(false);
    const [canAcceptWaiver, setCanAcceptWaiver] = useState(false);
    const [waiverChecked, setWaiverChecked] = useState(false);

    // Form data state to store user inputs locally
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

    const [error, setError] = useState(""); // State to store and display error messages

    // Generic handler to update form state based on input names
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

    // Form submission logic to process signup request
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form refresh
        setError(""); // Clear previous error messages

        // Basic password confirmation check
        if (formData.password !== formData.retypePassword) {
            setError("Passwords do not match");
            return;
        }

        // Check for required fields before proceeding
        if (
            !formData.email ||
            !formData.password ||
            !formData.firstName ||
            !formData.lastName
        ) {
            setError("Please fill in all required fields");
            return;
        }

        // Ensure user has accepted the waiver
        if (!waiverChecked) {
            setError("Please accept the liability waiver");
            return;
        }

        // Create waiver acceptance data before saving the user account
        const waiver = createWaiverRecord();

        // Send data to springboot as JSON to /api/auth/signup
        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    dateOfBirth: formData.dob,       // must be "YYYY-MM-DD" format for Spring to parse
                    phoneNumber: formData.phoneNumber,
                    role: formData.role,              // already lowercase from the <select>, don't uppercase it
                    role: formData.role.toUpperCase(), // Spring expects DONOR or RECIPIENT
                    waiver
                })
            });

            if (response.ok) {
                alert("Account created successfully!");
                navigate("/Login"); // Redirect to login on successful signup
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
                <span className="header_title">Love Thy Neighbor</span>

                <div className="header_links">
                    <Link to="/Login">
                        <button className="signupbtn">
                            Login
                        </button>
                    </Link>
                </div>
            </nav>

            <div className="login_banner">
                <section className="login_card">

                    <p className="login_label">
                        Please Enter Your Details
                    </p>

                    <h2 className="login_header">
                        Create Account
                    </h2>

                    {/* Display error messages at the top of the form */}
                    {error && (
                        <p
                            className="error_message"
                            style={{
                                color: "red",
                                textAlign: "center"
                            }}
                        >
                            {error}
                        </p>
                    )}

                    {/* Added onSubmit handler to form element */}
                    <form
                        className="login_info"
                        onSubmit={handleSubmit}
                    >

                        <div className="create_col">

                            {/* Added value and onChange to make inputs controlled */}
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
                                type="text"
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
                            <option value="">
                                Select Role
                            </option>

                            <option value="donor">
                                Donor
                            </option>

                            <option value="recipient">
                                Recipient
                            </option>
                        </select>

                        <div className="waiver_checkbox">
                            <label>

                                <input
                                    type="checkbox"
                                    checked={waiverChecked}
                                    disabled={!canAcceptWaiver}
                                    onChange={(e) =>
                                        setWaiverChecked(e.target.checked)
                                    }
                                />

                                {" "}
                                I have read and agree to the{" "}

                                <span
                                    className="waiver_link"
                                    onClick={() => setShowWaiver(true)}
                                >
                                    liability waiver
                                </span>

                            </label>

                            <p className="waiver_helper_text">
                                Please review the waiver before continuing with account creation.
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
                            <button className="cancel_btn">
                                Cancel
                            </button>
                        </Link>
                    </div>

                </section>
            </div>

            {showWaiver && (
                <div className="waiver_modal">

                    <div className="waiver_content">

                        <h3>
                            Liability Waiver
                        </h3>

                        <p className="waiver_intro_text">
                            Scroll through the waiver below before accepting.
                        </p>

                        {/* Shared waiver text is reused anywhere the waiver needs to be displayed */}
                        <div
                            className="waiver_box"
                            onScroll={handleWaiverScroll}
                        >
                            <WaiverText />
                        </div>

                        <button
                            className={`submit_btn ${
                                !canAcceptWaiver
                                    ? "disabled_btn"
                                    : ""
                            }`}
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