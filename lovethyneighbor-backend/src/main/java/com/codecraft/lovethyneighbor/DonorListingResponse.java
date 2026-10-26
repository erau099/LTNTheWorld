package com.codecraft.lovethyneighbor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class DonorListingResponse {
    private Long id;
    private String foodItem;
    private String status;
    private LocalDate date;
    private LocalDateTime pickupTime;
    
    // Recipient info
    private UUID recipientId;
    private String recipientName;

    // Review info (null if unreviewed)
    private Integer reviewRating;
    private String reviewComment;

    public DonorListingResponse() {}

    public DonorListingResponse(Long id, String foodItem, String status, LocalDate date,
                                LocalDateTime pickupTime, UUID recipientId, String recipientName,
                                Integer reviewRating, String reviewComment) {
        this.id = id;
        this.foodItem = foodItem;
        this.status = status;
        this.date = date;
        this.pickupTime = pickupTime;
        this.recipientId = recipientId;
        this.recipientName = recipientName;
        this.reviewRating = reviewRating;
        this.reviewComment = reviewComment;
    }

    public Long getId() { return id; }
    public String getFoodItem() { return foodItem; }
    public String getStatus() { return status; }
    public LocalDate getDate() { return date; }
    public LocalDateTime getPickupTime() { return pickupTime; }
    public UUID getRecipientId() { return recipientId; }
    public String getRecipientName() { return recipientName; }
    public Integer getReviewRating() { return reviewRating; }
    public String getReviewComment() { return reviewComment; }
}