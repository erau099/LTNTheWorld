package com.codecraft.lovethyneighbor;

import java.util.ArrayList;
import java.util.List;

public class UserActivityDTO {

    private UserSummaryDTO user;
    private List<Food> listings = new ArrayList<>();
    private int totalListings;
    private int activeListings;
    private int claimedListings;
    private int completedListings;
    private int removedListings;

    public UserActivityDTO() {}

    public UserActivityDTO(UserSummaryDTO user, List<Food> listings) {
        this.user = user;
        this.listings = listings != null ? listings : new ArrayList<>();
        this.totalListings = this.listings.size();

        for (Food food : this.listings) {
            String status = food.getStatus() != null ? food.getStatus().toUpperCase() : "";
            switch (status) {
                case "ACTIVE":
                    this.activeListings++;
                    break;
                case "CLAIMED":
                case "SCHEDULED":
                    this.claimedListings++;
                    break;
                case "COMPLETED":
                    this.completedListings++;
                    break;
                case "REMOVED_BY_ADMIN":
                    this.removedListings++;
                    break;
                default:
                    break;
            }
        }
    }

    public UserSummaryDTO getUser() { return user; }
    public void setUser(UserSummaryDTO user) { this.user = user; }

    public List<Food> getListings() { return listings; }
    public void setListings(List<Food> listings) { this.listings = listings; }

    public int getTotalListings() { return totalListings; }
    public void setTotalListings(int totalListings) { this.totalListings = totalListings; }

    public int getActiveListings() { return activeListings; }
    public void setActiveListings(int activeListings) { this.activeListings = activeListings; }

    public int getClaimedListings() { return claimedListings; }
    public void setClaimedListings(int claimedListings) { this.claimedListings = claimedListings; }

    public int getCompletedListings() { return completedListings; }
    public void setCompletedListings(int completedListings) { this.completedListings = completedListings; }

    public int getRemovedListings() { return removedListings; }
    public void setRemovedListings(int removedListings) { this.removedListings = removedListings; }
}
