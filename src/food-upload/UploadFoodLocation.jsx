import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import UploadLayout from "./UploadLayout.jsx";
import { useFoodDraft, detailsError, locationError, todayString } from "./foodDraft.js";

function UploadFoodLocation() {
    const navigate = useNavigate();
    const [draft, updateDraft] = useFoodDraft();
    const [error, setError] = useState("");

    // Story 326: Address mode toggle ("saved" vs "custom")
    const [addressMode, setAddressMode] = useState("custom");
    const [savedAddress, setSavedAddress] = useState(null);
    const [loadingSavedAddress, setLoadingSavedAddress] = useState(false);
    const [savedAddressError, setSavedAddressError] = useState("");

    // Story 326: Autocomplete suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const autocompleteRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Details must be filled in first
    if (detailsError(draft)) {
        return <Navigate to="/UploadFoodDetails" replace />;
    }

    // Story 326 AC: 1-click selection of saved address from profile
    const loadSavedAddress = async () => {
        setLoadingSavedAddress(true);
        setSavedAddressError("");
        try {
            const res = await fetch("/api/addresses/me", {
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                const formatted = [
                    data.streetAddress,
                    data.city,
                    `${data.state} ${data.zipCode}`,
                    data.country
                ].filter(Boolean).join(", ");

                setSavedAddress(formatted);
                updateDraft({ address: formatted });
            } else if (res.status === 404) {
                setSavedAddressError("No address saved in your profile yet. Enter a pickup location below.");
                setAddressMode("custom");
            } else {
                setSavedAddressError("Unable to load profile address. You can enter an address manually.");
                setAddressMode("custom");
            }
        } catch (err) {
            console.error("Error fetching profile address:", err);
            setSavedAddressError("Failed to fetch profile address.");
            setAddressMode("custom");
        } finally {
            setLoadingSavedAddress(false);
        }
    };

    const handleModeChange = (mode) => {
        setAddressMode(mode);
        setError("");
        if (mode === "saved") {
            loadSavedAddress();
        }
    };

    // Story 326 AC: Donors typing an address see Sacramento area suggestions
    const fetchSuggestions = (query) => {
        if (!query || query.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);
        // Prioritize Sacramento CA area bounding box
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=-121.75,38.80,-121.20,38.40&bounded=0&countrycodes=us&limit=5`;

        fetch(url, {
            headers: {
                "Accept": "application/json"
            }
        })
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => {
                setSuggestions(Array.isArray(data) ? data : []);
                setShowSuggestions(true);
            })
            .catch((err) => {
                console.error("Autocomplete search error:", err);
                setSuggestions([]);
            })
            .finally(() => {
                setIsSearching(false);
            });
    };

    const handleAddressInput = (e) => {
        const val = e.target.value;
        updateDraft({ address: val });
        setError("");

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 350);
    };

    const handleSelectSuggestion = (item) => {
        updateDraft({ address: item.display_name });
        setSuggestions([]);
        setShowSuggestions(false);
        setError("");
    };

    // Close autocomplete on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateDraft({ [name]: value });
        setError("");
    };

    const handleNext = (e) => {
        e.preventDefault();
        const message = locationError(draft);
        if (message) {
            setError(message);
            return;
        }
        navigate("/UploadFoodPhoto");
    };

    return (
        <UploadLayout step={2}>
            <form className="upload_body" onSubmit={handleNext}>
                <div className="upload_format">
                    <h2 className="page_title">Pickup Location</h2>

                    {/* Story 326: Quick toggle */}
                    <div className="address_toggle_group" role="radiogroup" aria-label="Pickup location type">
                        <button
                            type="button"
                            className={`address_toggle_btn ${addressMode === "saved" ? "active" : ""}`}
                            onClick={() => handleModeChange("saved")}
                        >
                            Use my saved profile address
                        </button>
                        <button
                            type="button"
                            className={`address_toggle_btn ${addressMode === "custom" ? "active" : ""}`}
                            onClick={() => handleModeChange("custom")}
                        >
                            Enter a different pickup location
                        </button>
                    </div>

                    {loadingSavedAddress && (
                        <p className="saved_address_status">Loading saved address from profile...</p>
                    )}

                    {savedAddressError && (
                        <p className="upload_error" style={{ marginTop: 8 }}>{savedAddressError}</p>
                    )}

                    {addressMode === "saved" && savedAddress && (
                        <div className="saved_address_card">
                            <span className="saved_badge">✓ 1-Click Profile Address</span>
                            <p className="saved_address_text"><strong>{savedAddress}</strong></p>
                        </div>
                    )}

                    {addressMode === "custom" && (
                        <div className="autocomplete_wrapper" ref={autocompleteRef}>
                            <label className="input_title" htmlFor="address">Pickup Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                className="user_input"
                                maxLength={255}
                                placeholder="Start typing address (e.g. 6000 J St, Sacramento)..."
                                value={draft.address}
                                onChange={handleAddressInput}
                                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                autoComplete="off"
                            />
                            {isSearching && <span className="autocomplete_spinner">Searching suggestions...</span>}

                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="autocomplete_dropdown" role="listbox">
                                    {suggestions.map((item, idx) => (
                                        <li
                                            key={idx}
                                            className="autocomplete_item"
                                            role="option"
                                            onClick={() => handleSelectSuggestion(item)}
                                        >
                                            📍 {item.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Story 326 Privacy Safeguard: Inform donor */}
                    <div className="privacy_safeguard_box">
                        <span className="privacy_icon">🔒</span>
                        <p className="privacy_text">
                            <strong>Privacy Safeguard:</strong> Only your approximate neighborhood / city is displayed publicly on the dashboard.
                            Your full street address is kept safe and only revealed to the recipient once you approve their claim request.
                        </p>
                    </div>
                </div>

                <div className="upload_format">
                    <label className="input_title" htmlFor="date">Pickup Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        className="user_input"
                        min={todayString()}
                        value={draft.date}
                        onChange={handleChange}
                    />
                </div>

                <div className="time_format">
                    <div>
                        <label className="input_title" htmlFor="startTime">Time Start</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            className="user_input"
                            value={draft.startTime}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="input_title" htmlFor="endTime">Time End</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            className="user_input"
                            value={draft.endTime}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {error && <p className="upload_error">{error}</p>}

                <div className="upload_nav_btn">
                    <button
                        type="button"
                        className="upload_cancel_btn"
                        onClick={() => navigate("/UploadFoodDetails")}
                    >
                        Back
                    </button>
                    <button type="submit" className="upload_next_btn">
                        Next: Upload Photo
                    </button>
                </div>
            </form>
        </UploadLayout>
    );
}

export default UploadFoodLocation;
