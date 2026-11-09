import React, { useState, useEffect } from "react";
import DashboardHeader from "./components/DashboardHeader";
import WaiverText from "./Waivers/WaiverText.jsx";
import "./ReceiverProfile.css";

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
    <div className={`rp-inputWrap ${editable ? "is-editing" : ""}`}>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        disabled={!editable || !canEdit}
        className="rp-input"
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

function ReceiverProfile() {
  const [showSignedWaiver, setShowSignedWaiver] = useState(false);
  const [user, setUser] = useState(null);

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
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
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
      <DashboardHeader role="recipient" />

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