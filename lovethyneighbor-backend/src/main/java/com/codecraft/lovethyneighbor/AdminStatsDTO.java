package com.codecraft.lovethyneighbor;

public class AdminStatsDTO {
    private long totalUsers;
    private long activeListings;
    private long pendingReports;

    public AdminStatsDTO() {}

    public AdminStatsDTO(long totalUsers, long activeListings, long pendingReports) {
        this.totalUsers = totalUsers;
        this.activeListings = activeListings;
        this.pendingReports = pendingReports;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

    public long getActiveListings() { return activeListings; }
    public void setActiveListings(long activeListings) { this.activeListings = activeListings; }

    public long getPendingReports() { return pendingReports; }
    public void setPendingReports(long pendingReports) { this.pendingReports = pendingReports; }
}
