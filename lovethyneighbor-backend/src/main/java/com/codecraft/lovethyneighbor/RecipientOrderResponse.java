package com.codecraft.lovethyneighbor;

public class RecipientOrderResponse {
    private Long id;
    private Long foodId;
    private String donor;
    private String date;
    private String time;
    private String food;
    private String status;

    // Review fields
    private boolean reviewed;
    private Integer reviewRating;
    private String reviewComment;

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

    public Long getId() { return id; }
    public Long getFoodId() { return foodId; }
    public String getDonor() { return donor; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public String getFood() { return food; }
    public String getStatus() { return status; }
    public boolean isReviewed() { return reviewed; }
    public Integer getReviewRating() { return reviewRating; }
    public String getReviewComment() { return reviewComment; }
}