import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "./utils/auth";
import "./index.css";
import "./App.css";
import "./CDashboard.css";
import "./ReceiverProfile.css";
import WaiverText from "./Waivers/WaiverText.jsx";

const DROPDOWN = ["Profile", "Swap View", "Sign Out"];

function PencilIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25z" />
      <path d="M20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function EditableInput({
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  editable,
  onToggleEdit,
  ariaLabel,
  canEdit = true,
}) {
  return (
    <div className={`rp-inputWrap ${editable ? "is-editing" : ""}`}>
      <input
        className="rp-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={!editable || !canEdit}
        aria-label={ariaLabel || name}
        autoComplete="off"
      />

      {canEdit && (
        <button
          type="button"
          className="rp-editBtn"
          onClick={() => onToggleEdit(name)}
          aria-label={editable ? `Stop editing ${name}` : `Edit ${name}`}
          title={editable ? "Lock" : "Edit"}
        >
          <PencilIcon className="rp-pencil" />
        </button>
      )}
    </div>
  );
}

export default function ReceiverProfile() {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [user, setUser] = useState({
    firstName: "User",
  });

  const [showSignedWaiver, setShowSignedWaiver] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "******",
    dob: "",
    phone: "",
    allergies: "",
  });

  const [editing, setEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    dob: false,
    phone: false,
    allergies: false,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);

    window.addEventListener("scroll", onScroll);

    function handleClickOut(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOut);

    return () => {
      document.removeEventListener("mousedown", handleClickOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    fetch("/api/users/me", {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        return response.json();
      })
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          dob: data.dateOfBirth || "",
          phone: data.phoneNumber || "",
          allergies: data.allergies || "",
        }));

        setUser((prev) => ({
          ...prev,
          firstName: data.firstName || "User",
        }));
      })
      .catch((error) => {
        console.error("Error loading receiver profile:", error);
      });
  }, []);

  const handleAction = async (item) => {
    if (item === "Sign Out") {
      await logout();
      navigate("/");
    } else {
      console.log(item);
    }

    setDropdownOpen(false);
  };

  const canSave = useMemo(() => {
    return (
      form.firstName.trim() !== "" &&
      form.lastName.trim() !== "" &&
      form.email.trim() !== "" &&
      form.dob !== "" &&
      form.phone.trim() !== ""
    );
  }, [form]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function toggleEdit(field) {
    setEditing((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.firstName.trim()) {
      alert("First name is required.");
      return;
    }

    if (!form.lastName.trim()) {
      alert("Last name is required.");
      return;
    }

    if (!emailPattern.test(form.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    if (!form.dob) {
      alert("Date of birth is required.");
      return;
    }

    const selectedDob = new Date(`${form.dob}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDob > today) {
      alert("Date of birth cannot be in the future.");
      return;
    }

    if (!form.phone.trim()) {
      alert("Phone number is required.");
      return;
    }

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          dateOfBirth: form.dob,
          phoneNumber: form.phone.trim(),
          allergies: form.allergies,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to save profile");
      }

      const updatedUser = await response.json();

      setForm((prev) => ({
        ...prev,
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        email: updatedUser.email || "",
        dob: updatedUser.dateOfBirth || "",
        phone: updatedUser.phoneNumber || "",
        allergies: updatedUser.allergies || "",
      }));

      setUser((prev) => ({
        ...prev,
        firstName: updatedUser.firstName || "User",
      }));

      setEditing((prev) => {
        const next = { ...prev };

        Object.keys(next).forEach((key) => {
          next[key] = false;
        });

        return next;
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error saving receiver profile:", error);
      alert(error.message || "Unable to update profile.");
    }
  }

  return (
    <div className="rp-page">
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className="header_title">Hello, {user.firstName}</span>

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

      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-subtitle">Your Information</div>
          <h1 className="rp-title">Profile</h1>
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
              placeholder="Allergies: Peanut, Milk, Shellfish"
              editable={editing.allergies}
              onToggleEdit={toggleEdit}
              ariaLabel="Allergies"
            />
          </div>

          <button
            className="rp-saveBtn"
            type="submit"
            disabled={!canSave}
          >
            Save Changes
          </button>
        </form>

        <div className="waiver_signed_info">
          <span className="waiver_signed_title">Waiver Signed</span>

          <p className="waiver_signed_date">
            {user?.waiver?.acceptedAt
              ? new Date(user.waiver.acceptedAt).toLocaleString()
              : "Waiver date unavailable"}
          </p>

          <button
            type="button"
            className="waiver_view_btn"
            onClick={() => setShowSignedWaiver(true)}
          >
            View Waiver
          </button>
        </div>
      </div>

      {showSignedWaiver && (
        <div className="waiver_modal">
          <div className="waiver_content">
            <h3>Signed Liability Waiver</h3>

            <p className="waiver_intro_text">
              This waiver is shown for reference only.
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