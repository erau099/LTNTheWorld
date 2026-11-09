import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DonorNotificationBell from "../donor-dashboard/DonorNotificationBell";
import RecipientNotificationBell from "../recipient-dashboard/RecipientNotificationBell";
import { logout } from "../utils/auth";
import "../index.css";
import "../App.css";
import "../CDashboard.css";

// DT-311: One consistent signed-in navigation bar for donor and recipient pages.
export default function DashboardHeader({ role: roleOverride, onDonorNotification, userLocation }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [account, setAccount] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch("/api/users/me", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setAccount(data);
      })
      .catch(() => {
        if (active) setAccount(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll);
    document.addEventListener("mousedown", onOutsideClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onOutsideClick);
    };
  }, []);

  const pathname = location.pathname.toLowerCase();
  const routeRole =
    pathname.includes("recipient") || pathname.includes("receiver")
      ? "recipient"
      : pathname.includes("donor")
      ? "donor"
      : null;
  const role = String(roleOverride || account?.role || routeRole || "").toLowerCase();
  const isRecipient = role === "recipient";
  const dashboardPath = isRecipient ? "/recipient-dashboard" : "/donor-dashboard";
  const historyPath = isRecipient ? "/recipient-past-orders" : "/donor-past-listings";
  const profilePath = isRecipient ? "/receiver-profile" : "/donor-profile";
  const displayName = account?.firstName || account?.name || "User";

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <span className="header_title">Hello, {displayName}</span>
      <div className="header_links">
        <button type="button" className="headerbtn" onClick={() => navigate("/")}>
          Home
        </button>
        <button type="button" className="headerbtn" onClick={() => navigate(dashboardPath)}>
          Dashboard
        </button>
        <button type="button" className="headerbtn" onClick={() => navigate(historyPath)}>
          {isRecipient ? "Orders" : "Past Listings"}
        </button>
        <button type="button" className="headerbtn" onClick={() => navigate(profilePath)}>
          Profile
        </button>
        {isRecipient ? (
          <RecipientNotificationBell
            userLocation={userLocation}
            onSelectNotification={() => navigate(historyPath)}
          />
        ) : (
          <DonorNotificationBell
            onSelectNotification={onDonorNotification || (() => navigate(historyPath))}
          />
        )}
        <div className="gear_wrap" ref={dropdownRef}>
          <button
            type="button"
            className="gear_btn"
            aria-label="Account settings"
            aria-expanded={dropdownOpen}
            onClick={() => setDropdownOpen((open) => !open)}
          >
            ⚙
          </button>
          {dropdownOpen && (
            <div className="dropdown">
              <button
                type="button"
                className="dropdown_item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(profilePath);
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="dropdown_item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/settings");
                }}
              >
                Settings
              </button>
              <button type="button" className="dropdown_item" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}