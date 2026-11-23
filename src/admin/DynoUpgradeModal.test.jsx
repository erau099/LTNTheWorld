import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DynoUpgradeModal from "./DynoUpgradeModal";

describe("DynoUpgradeModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("displays upgrade recommendation popup a few seconds after mount when capacity threshold is reached", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        upgradeRecommended: true,
        currentTier: "512 MB tier (Heroku Basic / Standard-1X)",
        recommendedPlan: "Heroku Standard-2X (1 GB RAM)",
        heapUsedMb: 242.5,
        heapMaxMb: 280.0,
        peakHeapPercent: 86.6,
        totalUsers: 175,
        activeListings: 44,
        reasons: ["Peak JVM heap reached 86.6% of 280 MB"],
        headline: "Good news — Love Thy Neighbor is growing!",
        message: "We are reaching and helping more users than our 512 MB dyno can comfortably serve. Upgrade to Heroku Standard-2X (1 GB RAM).",
      }),
    });

    render(<DynoUpgradeModal delayMs={3000} />);

    // Should not show immediately upon login
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Love Thy Neighbor is growing/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Upgrade: Heroku Standard-2X \(1 GB RAM\)/i)).toBeInTheDocument();
    expect(screen.getByText("Peak JVM heap reached 86.6% of 280 MB")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Dismiss for This Session/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("ltn_dyno_upgrade_dismissed")).toBe("true");
  });

  it("does not display popup when capacity is healthy", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        upgradeRecommended: false,
      }),
    });

    render(<DynoUpgradeModal delayMs={3000} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
