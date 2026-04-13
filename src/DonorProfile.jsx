import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "./utils/auth";
import "./index.css";
import "./App.css";
import "./CDashboard.css";
import "./DonorProfile.css";

const NAV_LINKS = ["Discover", "Orders"];
const DROPDOWN = ["Profile", "Swap View", "Sign Out"];

const STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana",
  "Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana",
  "Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina",
  "North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
  "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming"
];

const COUNTRIES = ["United States", "Canada", "Mexico"];

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
    <div className={`dp-inputWrap ${editable ? "is-editing" : ""}`}>
      <input
        className="dp-input"
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
        className="dp-editBtn"
        onClick={() => onToggleEdit(name)}
        aria-label={editable ? `Stop editing ${name}` : `Edit ${name}`}
        title={editable ? "Lock" : "Edit"}
      >
        <PencilIcon className="dp-pencil" />
      </button>
    </div>
  );
}

function EditableSelect({ name, value, onChange, editable, onToggleEdit, options, ariaLabel }) {
  return (
    <div className={`dp-inputWrap dp-selectWrap ${editable ? "is-editing" : ""}`}>
      <select
        className="dp-input dp-select"
        name={name}
        value={value}
        onChange={onChange}
        disabled={!editable}
        aria-label={ariaLabel || name}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <button
        type="button"
        className="dp-editBtn"
        onClick={() => onToggleEdit(name)}
        aria-label={editable ? `Stop editing ${name}` : `Edit ${name}`}
        title={editable ? "Lock" : "Edit"}
      >
        <PencilIcon className="dp-pencil" />
      </button>
    </div>
  );
}

export default function DonorProfile() {
  // header state (copied from CDashboard) 
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState({ firstName: "Test" });

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    // keep this commented out otherwise you'll route straight to login page if you try accessing donor profile page
    /*
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

  const [form, setForm] = useState({
    firstName: "Joe",
    lastName: "Shmoe",
    email: "jshmoe24@gmail.com",
    password: "******",
    dob: "01/01/2001",
    phone: "(916)-111-1111",
    address: "9999 Josh Way",
    zip: "12345",
    city: "Sacramento",
    state: "California",
    country: "United States",
  });

  const [editing, setEditing] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
    dob: false,
    phone: false,
    address: false,
    zip: false,
    city: false,
    state: false,
    country: false,
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
    console.log("Saving donor profile:", form);

    setEditing((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = false));
      return next;
    });
  }

  return (
    <div className="dp-page">
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
      <div className="dp-card">
        <div className="dp-header">
          <div className="dp-subtitle">Your Information</div>
          <h1 className="dp-title">Profile</h1>
        </div>

        <form className="dp-form" onSubmit={handleSave}>
          <div className="dp-grid">
            <div className="dp-twoCol">
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

            <div className="dp-twoCol">
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

            <div className="dp-twoCol">
              <EditableInput
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street Address"
                editable={editing.address}
                onToggleEdit={toggleEdit}
                ariaLabel="Street address"
              />
              <EditableInput
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="Zip"
                editable={editing.zip}
                onToggleEdit={toggleEdit}
                ariaLabel="Zip code"
              />
            </div>

            <EditableInput
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              editable={editing.city}
              onToggleEdit={toggleEdit}
              ariaLabel="City"
            />

            <div className="dp-twoCol">
              <EditableSelect
                name="state"
                value={form.state}
                onChange={handleChange}
                editable={editing.state}
                onToggleEdit={toggleEdit}
                options={STATES}
                ariaLabel="State"
              />
              <EditableSelect
                name="country"
                value={form.country}
                onChange={handleChange}
                editable={editing.country}
                onToggleEdit={toggleEdit}
                options={COUNTRIES}
                ariaLabel="Country"
              />
            </div>
          </div>

          <button className="dp-saveBtn" type="submit" disabled={!canSave}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}