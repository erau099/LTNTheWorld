package com.codecraft.lovethyneighbor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recipient")
public class RecipientOrderController {

    private final FoodRepository foodRepository;
    private final ReviewRepository reviewRepository;

    public RecipientOrderController(FoodRepository foodRepository, ReviewRepository reviewRepository) {
        this.foodRepository = foodRepository;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping("/orders")
    public List<RecipientOrderResponse> getRecipientOrders(Authentication authentication) {
        UUID recipientId = UUID.fromString(authentication.getName());

        return foodRepository.findByClaimedByUserId(recipientId)
                .stream()
                .map(food -> {
                    String donorName = "Anonymous";
                    if (food.getUser() != null) {
                        donorName = food.getUser().getName();
                    }

                    // Check if a review exists for this food item
                    List<Review> reviews = reviewRepository.findByFoodId(food.getId());
                    boolean reviewed = !reviews.isEmpty();
                    Integer rating = reviewed ? reviews.get(0).getRating() : null;
                    String comment = reviewed ? reviews.get(0).getComment() : null;

                    // Story 108 Sub-task 3 & 4: Progressive Address Disclosure and Directions Link
                    boolean isApprovedOrCompleted = "SCHEDULED".equalsIgnoreCase(food.getStatus())
                            || "COMPLETED".equalsIgnoreCase(food.getStatus());

                    String address;
                    Double latitude = null;
                    Double longitude = null;
                    String directionsUrl = null;

                    if (isApprovedOrCompleted) {
                        address = food.getAddress();
                        latitude = food.getLatitude();
                        longitude = food.getLongitude();
                        if (address != null && !address.isBlank()) {
                            directionsUrl = "https://www.google.com/maps/dir/?api=1&destination="
                                    + URLEncoder.encode(address.trim(), StandardCharsets.UTF_8);
                        }
                    } else {
                        address = "Locked until donor approves request";
                    }

                    // Story 108 Sub-task 5: 72-hour review eligibility after COMPLETED
                    boolean isCompleted = "COMPLETED".equalsIgnoreCase(food.getStatus());
                    boolean reviewEligible = false;
                    String eligibilityMessage = "Only completed pickups can be reviewed.";

                    if (reviewed) {
                        eligibilityMessage = "Order already reviewed.";
                    } else if (isCompleted) {
                        LocalDateTime completedAt = food.getCompletedAt();
                        if (completedAt == null) {
                            completedAt = food.getPickupEndTime() != null ? food.getPickupEndTime() : food.getCreatedAt();
                        }
                        if (completedAt != null && completedAt.isBefore(LocalDateTime.now().minusHours(72))) {
                            reviewEligible = false;
                            eligibilityMessage = "Review window expired (72-hour limit reached).";
                        } else {
                            reviewEligible = true;
                            eligibilityMessage = "Eligible for review.";
                        }
                    }

                    return new RecipientOrderResponse(
                            food.getId(),
                            food.getId(),
                            donorName,
                            food.getDate() != null ? food.getDate().toString() : "N/A",
                            food.getPickupTime() != null ? food.getPickupTime().toLocalTime().toString() : "N/A",
                            food.getFoodItem(),
                            food.getStatus(),
                            reviewed,
                            rating,
                            comment
                    ).withLocationDetails(address, latitude, longitude, directionsUrl)
                     .withReviewEligibility(reviewEligible, eligibilityMessage);
                })
                .toList();
    }
}
