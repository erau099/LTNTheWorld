import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "./utils/auth";
import "./index.css";
import "./App.css";
import "./CDashboard.css";
import "./ReceiverProfile.css";

const NAV_LINKS = ["Discover", "Orders"];
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
        disabled={!editable}
        aria-label={ariaLabel || name}
        autoComplete="off"
      />
      <button
        type="button"
        className="rp-editBtn"
        onClick={() => onToggleEdit(name)}
        aria-label={editable ? `Stop editing ${name}` : `Edit ${name}`}
        title={editable ? "Lock" : "Edit"}
      >
        <PencilIcon className="rp-pencil" />
      </button>
    </div>
  );
}

export default function ReceiverProfile() {
  //  header state (copied from CDashboard)
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState({ firstName: "Test" });

  useEffect(() => {

    // keep this commented out otherwise you'll route straight to login page if you try accessing receipient profile page
    /*
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate("/Login"); // matches your App.jsx route
    } else {
      setUser(currentUser);
    }
    */
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
  }, [navigate]);

  const handleAction = (item) => {
    if (item === "Sign Out") {
      logout();
      navigate("/");
    } else {
      console.log(item);
    }
    setDropdownOpen(false);
  };

  //if (!user) return null;

  //  profile form state 
  const [form, setForm] = useState({
    firstName: "Joe",
    lastName: "Shmoe",
    email: "jshmoe24@gmail.com",
    password: "******",
    dob: "01/01/2001",
    phone: "(916)-111-1111",
  });

  const [editing, setEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    dob: false,
    phone: false,
  });

  const canSave = useMemo(() => true, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleEdit(field) {
    setEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function handleSave(e) {
    e.preventDefault();
    console.log("Saving receiver profile:", form);

    setEditing((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = false));
      return next;
    });
  }

  return (
    <div className="rp-page">
      {/* Header */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className="header_title">Hello, {user.firstName}</span>
        <div className="header_links">
          {NAV_LINKS.map((l) => (
            <button key={l} className="headerbtn">{l}</button>
          ))}

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

      {/* Content */}
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
              editable={editing.password}
              onToggleEdit={toggleEdit}
              ariaLabel="Password"
            />

            <div className="rp-twoCol">
              <EditableInput
                name="dob"
                value={form.dob}
                onChange={handleChange}
                placeholder="DOB: mm/dd/yyyy"
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
          </div>

          <button className="rp-saveBtn" type="submit" disabled={!canSave}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}