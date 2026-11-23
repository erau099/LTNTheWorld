import { useEffect, useState } from "react";

const DISMISS_KEY = "ltn_dyno_upgrade_dismissed";

function DynoUpgradeModal({ delayMs = 3000 }) {
  const [health, setHealth] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "true") {
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/system-health", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.upgradeRecommended) {
          setHealth(data);
          setVisible(true);
        }
      } catch {
        // Ignore transient network errors for optional capacity advisory
      }
    }, delayMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [delayMs]);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible || !health) {
    return null;
  }

  return (
    <div
      className="admin-upgrade-overlay"
      role="presentation"
      onClick={handleDismiss}
    >
      <div
        className="admin-upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dyno-upgrade-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-upgrade-header">
          <span className="admin-upgrade-badge">Capacity Advisory</span>
          <button
            type="button"
            className="admin-upgrade-close"
            onClick={handleDismiss}
            aria-label="Close upgrade notice"
          >
            ✕
          </button>
        </div>

        <h2 id="dyno-upgrade-title">{health.headline}</h2>
        <p className="admin-upgrade-message">{health.message}</p>

        <div className="admin-upgrade-recommendation">
          <strong>Recommended Upgrade: {health.recommendedPlan}</strong>
          <span>
            Current tier: {health.currentTier}. Note: Standard-1X remains at 512 MB RAM;{" "}
            <strong>Standard-2X</strong> guarantees 1 GB of memory.
          </span>
        </div>

        <div className="admin-upgrade-metrics">
          <div>
            <span>Peak Heap</span>
            <strong>{health.peakHeapPercent}%</strong>
          </div>
          <div>
            <span>Heap Used / Max</span>
            <strong>
              {health.heapUsedMb} / {health.heapMaxMb} MB
            </strong>
          </div>
          <div>
            <span>Active Listings</span>
            <strong>{health.activeListings}</strong>
          </div>
          <div>
            <span>Registered Users</span>
            <strong>{health.totalUsers}</strong>
          </div>
        </div>

        {Array.isArray(health.reasons) && health.reasons.length > 0 && (
          <ul className="admin-upgrade-reasons">
            {health.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}

        <div className="admin-upgrade-actions">
          <button
            type="button"
            className="admin-upgrade-dismiss-btn"
            onClick={handleDismiss}
          >
            Dismiss for This Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default DynoUpgradeModal;
