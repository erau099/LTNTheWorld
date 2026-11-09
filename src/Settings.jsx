import DashboardHeader from "./components/DashboardHeader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationSettings from "./NotificationSettings";
import "./Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);

  useEffect(() => {
    let active = true;

    fetch("/api/users/me", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load account");
        return response.json();
      })
      .then((data) => {
        if (active) setRole(String(data.role || "").toLowerCase());
      })
      .catch((error) => console.error("Error loading account:", error));

    return () => { active = false; };
  }, []);

  const profilePath = role === "donor" ? "/donor-profile" : "/receiver-profile";

  return (
    <div className="settings-page">
      <DashboardHeader role={role} />

      <main className="settings-card">
        <p className="settings-eyebrow">Your Account</p>
        <h1>Account Settings</h1>
        <p className="settings-description">Manage your account and notification preferences.</p>

        <section className="settings-section">
          <h2>Profile</h2>
          <p className="settings-help-text">Manage your personal information and contact details.</p>
          <button type="button" disabled={!role} onClick={() => navigate(profilePath)}>
            View Profile
          </button>
        </section>

        <section className="settings-section">
          <NotificationSettings />
        </section>
      </main>
    </div>
  );
}
