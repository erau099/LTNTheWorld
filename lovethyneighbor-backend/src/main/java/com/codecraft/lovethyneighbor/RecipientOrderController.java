package com.codecraft.lovethyneighbor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
                    );
                })
                .toList();
    }
}