import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'; // Added for logout redirection
import { getCurrentUser, logout } from './utils/auth'; // Added for session management
import "./index.css";
import "./CDashboard.css";

const NAV_LINKS = ["Discover", "Orders"];
const DROPDOWN = ["Profile", "Swap View", "Sign Out"];

function CDashboard() {  
    const navigate = useNavigate(); // Hook to programmatically navigate between pages
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [user, setUser] = useState(null); // State to store currently logged in user

    useEffect(() => {
        // Authenticate user on component mount
        const currentUser = getCurrentUser();
        if (!currentUser) {
            navigate("/Login"); // Kick unauthenticated users back to login
        } else {
            setUser(currentUser); // Populate user state from localStorage
        }

        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);

        function handleClickOut(e){
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)){
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOut);
        return () => {
            document.removeEventListener("mousedown", handleClickOut);
            window.removeEventListener("scroll", onScroll);
        };
    }, [navigate]);

    // Handle dropdown actions including Sign Out
    const handleAction = (item) => {
        if (item === "Sign Out") {
            logout(); // Clear session data from localStorage
            navigate("/"); // Redirect back to landing page
        } else {
            console.log(item);
        }
        setDropdownOpen(false);
    };

    if (!user) return null; // Don't render until user state is loaded

    return (
        <div className="cdashboard">
            {/* NavBar */}
            <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
                {/* Dynamically display current user's first name */}
                <span className='header_title'>Hello, {user.firstName}</span>
                <div className='header_links'>
                    {NAV_LINKS.map((l) => (
                    <button key={l} className='headerbtn'>{l}</button>
                    ))}

                    {/* Gear Button and Dropdown Menu */}
                    <div className='gear_wrap' ref={dropdownRef}>
                        <button className='gear_btn' onClick={() => setDropdownOpen(!dropdownOpen)}>
                            ⚙
                        </button>
                        {dropdownOpen &&(
                            <div className='dropdown'>
                                {DROPDOWN.map((item) => (
                                    <button
                                        key={item}
                                        className={`dropdown_item`}
                                        onClick={() => handleAction(item)}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="dashboard_content">
                <h1>Welcome to your Dashboard</h1>
                {/* Display dynamic welcome message with full name */}
                <p>Glad to have you back, {user.firstName} {user.lastName}!</p>
                {/* Visual indicator of the user's role */}
                <div className="role_badge">{user.role}</div>

                {/* Simulated JSON display for demo purposes */}
                <div className="user_json_simulation">
                    <h3>User Data (JSON Simulation):</h3>
                    <p style={{fontSize: '0.8rem', color: '#888', marginBottom: '10px'}}>
                        This data is stored in your browser's local storage and was "generated" upon account creation.
                    </p>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}

export default CDashboard;
