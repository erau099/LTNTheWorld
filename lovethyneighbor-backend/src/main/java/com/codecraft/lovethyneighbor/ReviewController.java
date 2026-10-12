package com.codecraft.lovethyneighbor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.security.core.Authentication;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewRepository reviewRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public ReviewController(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    // Get reviews for a food item
    @GetMapping("/food/{foodId}")
    public List<Review> getReviews(@PathVariable Long foodId) {
        return reviewRepository.findByFoodId(foodId);
    }

    // Create a review
    @PostMapping
    public Map<String, Object> createReview(
            @RequestBody ReviewRequest request) {

        if (request.getRating() < 1 || request.getRating() > 5) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Rating must be between 1 and 5"
            );
        }

        UUID userId = request.getUserId();
        Long foodId = request.getFoodId();

        User user = entityManager.find(User.class, userId);
        if (user == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "User not found"
            );
        }

        Food food = entityManager.find(Food.class, foodId);
        if (food == null) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Food not found"
            );
        }

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
        UUID userId = UUID.fromString(authentication.getName());
        return reviewRepository.findByUserId(userId);
    }

    // Request body for creating a review
    public static class ReviewRequest {
        private UUID userId;
        private Long foodId;
        private int rating;
        private String comment;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

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
