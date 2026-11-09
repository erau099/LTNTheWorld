import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import WaiverText from "./Waivers/WaiverText.jsx";
import "./ReceiverProfile.css";

const DROPDOWN = ["Profile", "Settings", "Sign Out"];

function EditableInput({
  name,
  value,
  onChange,
  placeholder,
  editable,
  onToggleEdit,
  type = "text",
  ariaLabel,
  canEdit = true,
}) {
  return (
    <div className="rp-input-group">
      <div className="rp-input-wrapper">
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={!editable}
          className={`rp-input ${editable ? "rp-input-active" : ""}`}
        />
        {canEdit && (
          <button
            type="button"
            className="rp-pencil-btn"
            onClick={() => onToggleEdit(name)}
            aria-label={ariaLabel ? `Edit ${ariaLabel}` : `Edit ${name}`}
          >
            ✏️
          </button>
        )}
      </div>
    </div>
  );
}

function ReceiverProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSignedWaiver, setShowSignedWaiver] = useState(false);
  const dropdownRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "••••••••",
    dob: "",
    phone: "",
    allergies: "",
  });

  const [editing, setEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
    dob: false,
    phone: false,
    allergies: false,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setForm({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            password: "••••••••",
            dob: data.dateOfBirth || data.dob || "",
            phone: data.phoneNumber || data.phone || "",
            allergies: data.allergies || "",
          });
        }
      })
      .catch((err) => console.error("Error loading profile:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAction = (item) => {
    setDropdownOpen(false);
    if (item === "Profile") {
      navigate("/receiver-profile");
    } else if (item === "Settings") {
      navigate("/settings");
    } else if (item === "Sign Out") {
      logout();
      navigate("/");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          dateOfBirth: form.dob,
          phoneNumber: form.phone,
          allergies: form.allergies,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      setEditing({
        firstName: false,
        lastName: false,
        email: false,
        dob: false,
        phone: false,
        allergies: false,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(error.message || "Unable to update profile");
    }
  };

  const canSave = Object.values(editing).some(Boolean);

  return (
    <div className="rp-page">
      {/* Header synced across Receiver pages */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className="header_title">Hello, {user?.firstName || "Friend"}</span>

        <div className="header_links">
          <button className="headerbtn" onClick={() => navigate("/")}>
            Home
          </button>
          <button
            className="headerbtn"
            onClick={() => navigate("/recipient-dashboard")}
          >
            Dashboard
          </button>
          <button
            className="headerbtn"
            onClick={() => navigate("/recipient-past-orders")}
          >
            Orders
          </button>

          <div className="gear_wrap" ref={dropdownRef}>
            <button
              className="gear_btn"
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              ⚙
            </button>

            {dropdownOpen && (
              <div className="dropdown">
                {DROPDOWN.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="dropdown_item"
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

      {/* Main Profile Card */}
      <main className="rp-card">
        <div className="rp-header">
          <span className="rp-subtitle">Account Details</span>
          <h1 className="rp-title">Your Profile</h1>
        </div>

        <form className="rp-form" onSubmit={handleSave}>
          <div className="rp-grid">
            <div className="rp-twoCol">
              <EditableInput
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="First Name"
                editable={editing.firstName}
                onToggleEdit={toggleEdit}
                ariaLabel="First name"
              />

              <EditableInput
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                editable={editing.lastName}
                onToggleEdit={toggleEdit}
                ariaLabel="Last name"
              />
            </div>

            <EditableInput
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              editable={editing.email}
              onToggleEdit={toggleEdit}
              ariaLabel="Email"
            />

            <EditableInput
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              editable={false}
              onToggleEdit={toggleEdit}
              ariaLabel="Password"
              canEdit={false}
            />

            <div className="rp-twoCol">
              <EditableInput
                name="dob"
                type="date"
                value={form.dob}
                onChange={handleChange}
                placeholder="Date of Birth"
                editable={editing.dob}
                onToggleEdit={toggleEdit}
                ariaLabel="Date of birth"
              />

              <EditableInput
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(###)-###-####"
                editable={editing.phone}
                onToggleEdit={toggleEdit}
                ariaLabel="Phone number"
              />
            </div>

            <EditableInput
              name="allergies"
              value={form.allergies}
              onChange={handleChange}
              placeholder="Allergies (e.g. Peanut, Dairy, Shellfish)"
              editable={editing.allergies}
              onToggleEdit={toggleEdit}
              ariaLabel="Allergies"
            />
          </div>

          <button className="rp-saveBtn" type="submit" disabled={!canSave}>
            Save Changes
          </button>
        </form>

        <div className="waiver_signed_info">
          <div>
            <span className="waiver_signed_title">Liability Waiver</span>
            <p className="waiver_signed_date">
              {user?.waiver?.acceptedAt
                ? `Accepted on ${new Date(user.waiver.acceptedAt).toLocaleDateString()}`
                : "Signed on file"}
            </p>
          </div>

          <button
            type="button"
            className="waiver_view_btn"
            onClick={() => setShowSignedWaiver(true)}
          >
            View Waiver
          </button>
        </div>
      </main>

      {/* Signed Waiver Modal */}
      {showSignedWaiver && (
        <div className="waiver_modal" onClick={() => setShowSignedWaiver(false)}>
          <div className="waiver_content" onClick={(e) => e.stopPropagation()}>
            <h3>Signed Liability Waiver</h3>
            <p className="waiver_intro_text">
              This waiver is shown for reference and was signed during registration.
            </p>

            <div className="waiver_box">
              <WaiverText />
            </div>

            <button
              type="button"
              className="submit_btn"
              onClick={() => setShowSignedWaiver(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiverProfile;