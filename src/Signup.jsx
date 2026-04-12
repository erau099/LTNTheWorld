import { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";

function Signup({ setCurrentPage }) {
    const [showWaiver, setShowWaiver] = useState(false);
    const [canAcceptWaiver, setCanAcceptWaiver] = useState(false);
    const [waiverChecked, setWaiverChecked] = useState(false);

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

    return (
        <div className="login_page">

            <nav className="nav">
                <span className="header_title">Lighten The World</span>

                <div className="header_links">
                    <Link to="/Login"><button className="signupbtn">Login</button></Link>
                </div>
            </nav>

            <div className="login_banner">
                <section className="login_card">
                    <p className="login_label">Please Enter Your Details</p>
                    <h2 className="login_header">Create Account</h2>

                    <form className="login_info">
                        <div className="create_col">
                            <input type="text" placeholder="First Name" />
                            <input type="text" placeholder="Last Name" />
                        </div>

                        <input type="email" placeholder="Email Address" />
                        <input type="password" placeholder="Password" />
                        <input type="password" placeholder="Retype Password" />

                        <div className="create_col">
                            <input type="text" placeholder="DOB: MM/DD/YYYY" />
                            <input type="text" placeholder="Phone Number" />
                        </div>

                        <select className="select_role">
                            <option value="">Select Role</option>
                            <option value="donor">Donor</option>
                            <option value="recipient">Recipient</option>
                        </select>
                    </form>

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
                            >
                                liability waiver
                            </span>
                        </label>
                    </div>

                    <div className="continue_btn">
                        <button className="submit_btn" disabled = {!waiverChecked}>
                            Continue
                        </button>
                    </div>

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