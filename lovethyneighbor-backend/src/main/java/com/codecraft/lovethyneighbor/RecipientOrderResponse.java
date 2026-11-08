package com.codecraft.lovethyneighbor;

public class RecipientOrderResponse {
    private Long id;
    private Long foodId;
    private String donor;
    private String date;
    private String time;
    private String food;
    private String status;

    // Story 108 Sub-task 3 & 4: Progressive Address Disclosure and Directions
    private String address;
    private Double latitude;
    private Double longitude;
    private String directionsUrl;

    // Story 108 Sub-task 5: Review eligibility
    private boolean reviewed;
    private Integer reviewRating;
    private String reviewComment;
    private boolean reviewEligible;
    private String reviewEligibilityMessage;

    public RecipientOrderResponse() {}

    public RecipientOrderResponse(Long id, Long foodId, String donor, String date, String time,
                                  String food, String status, boolean reviewed,
                                  Integer reviewRating, String reviewComment) {
        this.id = id;
        this.foodId = foodId;
        this.donor = donor;
        this.date = date;
        this.time = time;
        this.food = food;
        this.status = status;
        this.reviewed = reviewed;
        this.reviewRating = reviewRating;
        this.reviewComment = reviewComment;
    }

    public RecipientOrderResponse withLocationDetails(String address, Double latitude, Double longitude, String directionsUrl) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.directionsUrl = directionsUrl;
        return this;
    }

    public RecipientOrderResponse withReviewEligibility(boolean reviewEligible, String reviewEligibilityMessage) {
        this.reviewEligible = reviewEligible;
        this.reviewEligibilityMessage = reviewEligibilityMessage;
        return this;
    }

    public Long getId() { return id; }
    public Long getFoodId() { return foodId; }
    public String getDonor() { return donor; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public String getFood() { return food; }
    public String getStatus() { return status; }
    public String getAddress() { return address; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getDirectionsUrl() { return directionsUrl; }
    public boolean isReviewed() { return reviewed; }
    public Integer getReviewRating() { return reviewRating; }
    public String getReviewComment() { return reviewComment; }
    public boolean isReviewEligible() { return reviewEligible; }
    public String getReviewEligibilityMessage() { return reviewEligibilityMessage; }
}
