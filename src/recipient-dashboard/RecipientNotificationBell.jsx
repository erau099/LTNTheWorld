import { useState, useEffect, useRef, useId, useCallback } from "react";
import { apiFetch } from "../api";
import "./RecipientNotificationBell.css";

function RecipientNotificationBell({ onSelectNotification }) {
	const [open, setOpen] = useState(false);
	const [showHistory, setShowHistory] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const wrapperRef = useRef(null);
	const buttonRef = useRef(null);
	const requestRef = useRef(null);
	const savingRef = useRef(false);
	const panelId = useId();
	const unreadCount = notifications.filter((notification) => !notification.read).length;

	// Refresh on opening and every 30 seconds. Cancel older refreshes.
	const loadNotifications = useCallback(async () => {
		if (savingRef.current) return;
		requestRef.current?.abort();
		const controller = new AbortController();
		requestRef.current = controller;
		if (!localStorage.getItem("token")) {
			setNotifications([]);
			setError("Sign in to view your notifications.");
			setLoading(false);
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await apiFetch("/api/notifications", { signal: controller.signal });
			if (!response.ok) throw new Error("Unable to load notifications. Please try again.");
			const data = await response.json();
			if (!Array.isArray(data)) throw new Error("Unable to load notifications. Please try again.");
			if (!controller.signal.aborted) {
				setNotifications([...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
			}
		} catch (failure) {
			if (!controller.signal.aborted) setError(failure.message);
		} finally {
			if (!controller.signal.aborted) setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadNotifications();
		const interval = setInterval(loadNotifications, 30000);
		return () => {
			clearInterval(interval);
			requestRef.current?.abort();
		};
	}, [loadNotifications]);

	useEffect(() => {
		if (!open) return;
		function closeOutside(event) {
			if (!wrapperRef.current?.contains(event.target)) setOpen(false);
		}
		function closeWithEscape(event) {
			if (event.key === "Escape") {
				setOpen(false);
				buttonRef.current?.focus();
			}
		}
		document.addEventListener("mousedown", closeOutside);
		document.addEventListener("focusin", closeOutside);
		document.addEventListener("keydown", closeWithEscape);
		return () => {
			document.removeEventListener("mousedown", closeOutside);
			document.removeEventListener("focusin", closeOutside);
			document.removeEventListener("keydown", closeWithEscape);
		};
	}, [open]);

	// Update the displayed read state only after the server accepts the change.
	async function markRead(notification) {
		if (savingRef.current) return;
		if (!notification || !notification.read) {
			savingRef.current = true;
			setSaving(true);
			setError("");
			requestRef.current?.abort();
			setLoading(false);
			try {
				const path = notification ? `/api/notifications/${notification.id}/read` : "/api/notifications/read-all";
				const response = await apiFetch(path, { method: "PATCH" });
				if (!response.ok) throw new Error("Unable to mark notifications as read. Please try again.");
				setNotifications((previous) => previous.map((item) =>
					!notification || item.id === notification.id ? { ...item, read: true } : item
				));
			} catch (failure) {
				setError(failure.message);
				return;
			} finally {
				savingRef.current = false;
				setSaving(false);
			}
		}
		if (notification?.foodId && onSelectNotification) {
			setOpen(false);
			onSelectNotification(notification);
		}
	}

	const visibleNotifications = showHistory ? notifications : notifications.slice(0, 5);

	return (
		<div className="recipient-notification-bell" ref={wrapperRef}>
			<button type="button" className="recipient-notification-trigger" ref={buttonRef}
				aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
				aria-expanded={open} aria-controls={panelId}
				onClick={() => {
					setOpen(!open);
					if (!open) { setShowHistory(false); loadNotifications(); }
				}}>
				<span aria-hidden="true">🔔</span>
				{unreadCount > 0 && <span className="recipient-notification-badge" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
			</button>
			{open && (
				<section id={panelId} className="recipient-notification-panel" aria-label="Notifications" aria-busy={loading || saving}>
					<div className="recipient-notification-heading">
						<h3>{showHistory ? "Notification history" : "Notifications"}</h3>
						{unreadCount > 0 && <button type="button" disabled={saving || loading} onClick={() => markRead(null)}>Mark all as read</button>}
					</div>
					{loading && <p role="status">Loading notifications...</p>}
					{error && <div role="alert"><p>{error}</p><button type="button" disabled={saving || loading} onClick={loadNotifications}>Retry</button></div>}
					{!loading && !error && notifications.length === 0 && <p>No notifications yet.</p>}
					<ul className="recipient-notification-list">
						{visibleNotifications.map((notification) => (
							<li key={notification.id}>
								<button type="button" disabled={saving || loading}
									className={`recipient-notification-item${notification.read ? "" : " unread"}`}
									onClick={() => markRead(notification)}>
									<strong>{!notification.read && <span className="recipient-notification-dot" aria-label="Unread" />}{notification.title}</strong>
									<span>{notification.message}</span>
									{notification.createdAt && <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>}
									{notification.foodId && <span className="recipient-notification-link">View orders →</span>}
								</button>
							</li>
						))}
					</ul>
					{notifications.length > 5 && <button type="button" className="recipient-notification-history" onClick={() => setShowHistory(!showHistory)}>{showHistory ? "Show recent notifications" : `View notification history (${notifications.length})`}</button>}
				</section>
			)}
		</div>
	);
}

export default RecipientNotificationBell;
