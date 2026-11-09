import { useEffect, useState } from "react";
import { deleteToken } from "firebase/messaging";
import { requestFCMToken } from "./firebaseMessaging";
import { messagingPromise } from "./firebase";

const TOKEN_KEY = "ltn_fcm_registered_token";

async function tokenApi(method, token) {
  const url = method === "GET"
    ? `/api/notifications/tokens?token=${encodeURIComponent(token)}`
    : "/api/notifications/tokens";
  const response = await fetch(url, {
    method,
    credentials: "include",
    ...(method === "GET" ? {} : {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }),
  });
  if (!response.ok) throw new Error(`Token API ${method} failed (${response.status})`);
  return method === "GET" ? response.json() : null;
}

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      const token = sessionToken();
      if (!token || typeof Notification === "undefined" || Notification.permission !== "granted") {
        if (active) setBusy(false);
        return;
      }
      try {
        const result = await tokenApi("GET", token);
        if (active) setEnabled(result.registered === true);
      } catch (error) {
        console.error("Unable to verify push registration:", error);
        if (active) setMessage("Could not verify notification settings. Please sign in and retry.");
      } finally {
        if (active) setBusy(false);
      }
    }
    loadStatus();
    return () => { active = false; };
  }, []);

  function sessionToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  async function toggleNotifications() {
    setBusy(true);
    setMessage("");
    try {
      if (enabled) {
        const token = sessionToken();
        if (!token) throw new Error("Missing registered browser token");
        await tokenApi("DELETE", token);
        localStorage.removeItem(TOKEN_KEY);
        setEnabled(false);
        try {
          const messaging = await messagingPromise;
          if (messaging) await deleteToken(messaging);
          setMessage("Push notifications disabled on this browser.");
        } catch (error) {
          console.warn("Server token removed, but Firebase token cleanup failed:", error);
          setMessage("Notifications disabled on your account; browser token cleanup was unsuccessful.");
        }
      } else {
        const token = await requestFCMToken();
        if (!token) {
          setMessage(typeof Notification !== "undefined" && Notification.permission === "denied"
            ? "Notifications are blocked in browser settings."
            : "Could not enable notifications. Check your browser permissions.");
          return;
        }
        await tokenApi("POST", token);
        localStorage.setItem(TOKEN_KEY, token);
        setEnabled(true);
        setMessage("Push notifications enabled on this browser.");
      }
    } catch (error) {
      console.error("Failed to update push notifications:", error);
      setMessage("Unable to update push notifications. Check your login and backend connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="notification-settings">
      <h3>Push Notifications</h3>
      <p>Receive browser notifications about food claims, approvals, and pickup updates.</p>
      <p className="notification-status" aria-live="polite">
        {message || (busy ? "Checking notification settings..." : enabled ? "Notifications are on" : "Notifications are off")}
      </p>
      <button
        type="button"
        className={`notification-toggle ${enabled ? "is-enabled" : "is-disabled"}`}
        onClick={toggleNotifications}
        disabled={busy}
        aria-pressed={enabled}
      >
        {busy ? "Updating..." : enabled ? "Notifications On — Disable" : "Notifications Off — Enable"}
      </button>
    </div>
  );
}
