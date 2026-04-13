import { useState } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
import { signup } from "./utils/auth"; // Imported local auth utility for signup logic

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
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default browser form refresh
        setError(""); // Clear previous error messages

        // Basic password confirmation check
        if (formData.password !== formData.retypePassword) {
            setError("Passwords do not match");
            return;
        }

        // Check for required fields before proceeding
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
            setError("Please fill in all required fields");
            return;
        }

        // Ensure user has accepted the waiver
        if (!waiverChecked) {
            setError("Please accept the liability waiver");
            return;
        }

        // Save user data to localStorage via auth utility
        const result = signup(formData);
        if (result.success) {
            alert("Account created successfully!");
            navigate("/Login"); // Redirect to login on successful signup
        } else {
            setError(result.message); // Show error if signup fails (e.g., user exists)
        }
    };

    return (
        <div className="login_page">

            <nav className="nav">
                <span className="header_title">Love Thy Neighbor</span>

                <div className="header_links">
                    <Link to="/Login"><button className="signupbtn">Login</button></Link>
                </div>
            </nav>

            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Please Enter Your Details</p>
                    <h2 className="login_header">Create Account</h2>

                    {/* Display error messages at the top of the form */}
                    {error && <p className="error_message" style={{color: 'red', textAlign: 'center'}}>{error}</p>}

                    {/* Added onSubmit handler to form element */}
                    <form className="login_info" onSubmit={handleSubmit}>
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
                                {" "}I have read and agree to the{" "}
                                <span
                                    className="waiver_link"
                                    onClick={() => setShowWaiver(true)}
                                    style={{textDecoration: 'underline', cursor: 'pointer', color: '#2d7a3a'}}
                                >
                                    liability waiver
                                </span>
                            </label>
                        </div>

                        <div className="continue_btn">
                            <button 
                                type="submit" // Changed to submit type for form processing
                                className="submit_btn" 
                                disabled={!waiverChecked}
                            >
                                Continue
                            </button>
                        </div>
                    </form>

                    <div className="center_cancel_btn">
                        <Link to="/"><button className="cancel_btn">Cancel</button></Link>
                    </div>
                </section>
            </div>

            {showWaiver && (
                <div className="waiver_modal">
                    <div className="waiver_content">
                        <h3>Liability Waiver</h3>

                        <div className="waiver_box" onScroll={handleWaiverScroll}>
                            <p>
                                By using this platform, you acknowledge that all food
                                exchanges are conducted between private individuals.
                                Lighten The World and Foundation 587 are not responsible
                                for the condition, safety, or quality of any donated food.
                            </p>

                            <p>
                                You understand that participation is voluntary and that
                                you should review all food information carefully, including
                                allergen information when provided.
                            </p>

                            <p>
                                You agree to communicate honestly, coordinate pickups in
                                good faith, and accept the risks associated with donating
                                or receiving food through the platform.
                            </p>

                            <p>
                                You understand that this waiver must be reviewed before
                                proceeding with account creation and that acceptance is
                                required in order to continue using the signup process.
                            </p>


                        </div>

                        <button
                            className={`submit_btn ${!canAcceptWaiver ? "disabled_btn" : ""}`}
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
