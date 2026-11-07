import { useState, useEffect, useRef, useCallback } from "react";
import "./DonorNotificationBell.css";

function DonorNotificationBell({ onSelectNotification }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    // Login uses an HttpOnly cookie now, so send it with the request (no localStorage token)
    try {
      const [listRes, countRes] = await Promise.all([
        fetch("/api/notifications", { credentials: "include" }),
        fetch("/api/notifications/unread-count", { credentials: "include" }),
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setNotifications(listData);
      }

      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s background sync
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notification) => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: "PATCH",
          credentials: "include",
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }

    setOpen(false);
    if (onSelectNotification) {
      onSelectNotification(notification);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="donor-bell-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="donor-bell-btn"
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        aria-label="View notifications"
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="donor-bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="donor-notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notifications-mark-all-btn"
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notifications-empty">No notifications yet.</div>
          ) : (
            <ul className="notifications-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => handleMarkAsRead(n)}
                >
                  <div className="notification-top-row">
                    <h4 className="notification-title">{n.title}</h4>
                    <span className="notification-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <p className="notification-msg">{n.message}</p>
                  {n.foodId && n.type !== "LISTING_EXPIRED" && (
                    <span className="notification-cta">Click to manage pickup &rarr;</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default DonorNotificationBell;
