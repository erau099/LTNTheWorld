import "./UploadFood.css"
import { Link } from "react-router-dom"

const STEPS = ["Food Details", "Location & Time", "Upload Photo"];

// Shared header and step indicator for the food upload pages.
// step is 1-3, or 0 for the submitted page (no step highlighted).
function UploadLayout({ step, children }) {
    return (
        <div className="upload_food_details">

            {/* Header */}
            <nav className="nav">
                <span className="header_title">Lighten The World</span>

                <div className="header_links">
                    <Link to="/donor-dashboard"><button className="headerbtn">Dashboard</button></Link>
                </div>
            </nav>

            {/* Upload Food Card */}
            <div className="upload_card">
                <div className="upload_banner">
                    <section className="upload_header">
                        {step === 0 ? (
                            <p className="num_text_on">Submitted</p>
                        ) : (
                            STEPS.map((label, i) => (
                                <div className="upload_step" key={label}>
                                    <p className={i + 1 === step ? "num_on" : "num_off"}>{i + 1}</p>
                                    <p className={i + 1 === step ? "num_text_on" : "num_text_off"}>{label}</p>
                                </div>
                            ))
                        )}
                    </section>

                    {children}
                </div>
            </div>
        </div>
    );
}

export default UploadLayout
