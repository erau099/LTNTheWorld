import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import "./index.css";

const NAV_LINKS = ["Discover", "Orders"];
const DROPDOWN = ["Profile", "Swap View", "Sign Out"];

function CDashboard() {  
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Check for logged in user
        const loggedInUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!loggedInUser) {
            navigate("/Login");
        } else {
            setUser(loggedInUser);
        }

        function handleClickOut(e){
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)){
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOut);
        return () => document.removeEventListener("mousedown", handleClickOut);
    }, [navigate]);

    const handleSignOut = () => {
        localStorage.removeItem("currentUser");
        navigate("/Login");
    };

    if (!user) return null;

    return (
        <div className="cdashboard">
            {/* NavBar */}
            <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
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
                                        onClick={() => {
                                            if (item === "Sign Out") {
                                                handleSignOut();
                                            } else {
                                                console.log(item);
                                            }
                                            setDropdownOpen(false);
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default CDashboard;