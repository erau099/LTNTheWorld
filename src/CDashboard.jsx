import { useState, useEffect, useRef } from 'react'
import "./index.css";

const NAV_LINKS = ["Discover", "Orders"];
const DROPDOWN = ["Profile", "Swap View", "Sign Out"];

function CDashboard() {  
    const [scrolled, setScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    //  Close dropdown on clicking out
    useEffect(() => {
        function handleClickOut(e){
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)){
                setDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOut);
        return () => document.removeEventListener("mousedown", handleClickOut);
    }, []);

    return (
        <div className="cdashboard">
            {/* NavBar */}
            <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
            <span className='header_title'>Hello, Joe</span>
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
                                            console.log(item);
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