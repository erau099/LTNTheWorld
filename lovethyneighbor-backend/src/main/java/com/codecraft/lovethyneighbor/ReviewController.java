package com.codecraft.lovethyneighbor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    // Get reviews for a food item by bigint ID
    @GetMapping("/food/{foodId}")
    public List<Review> getReviews(@PathVariable Long foodId) {
        return reviewRepository.findByFoodId(foodId);
    }

    // Create a review
    @PostMapping
    @Transactional
    public Map<String, Object> createReview(
            @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Rating must be between 1 and 5"
            );
        }

        if (request.getFoodId() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "foodId cannot be null"
            );
        }

        // 1. Resolve reviewer User from JWT sub (UUID)
        UUID userId = UUID.fromString(authentication.getName());
        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"
            );
        }

        // 2. Resolve Food item from bigint PK (Long)
        Food food = entityManager.find(Food.class, request.getFoodId());
        if (food == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Food listing not found"
            );
        }

        // 3. Save review
        Review review = new Review();
        review.setUser(user);
        review.setFood(food);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review saved = reviewRepository.save(review);

        return Map.of(
            "message", "Review submitted successfully",
            "id", saved.getId().toString()
        );
    }

    // Get reviews written by the signed-in user
    @GetMapping("/my-reviews")
    public List<Review> getMyReviews(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        UUID userId = UUID.fromString(authentication.getName());
        return reviewRepository.findByUserId(userId);
    }

    // DTO for incoming review payload
    public static class ReviewRequest {
        private Long foodId;
        private int rating;
        private String comment;

        public Long getFoodId() {
            return foodId;
        }

        public void setFoodId(Long foodId) {
            this.foodId = foodId;
        }

        public int getRating() {
            return rating;
        }

        public void setRating(int rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }
    }
}