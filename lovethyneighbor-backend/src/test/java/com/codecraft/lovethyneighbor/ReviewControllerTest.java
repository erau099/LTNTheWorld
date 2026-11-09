package com.codecraft.lovethyneighbor;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ReviewController reviewController;

    private UUID mockUserId;
    private User mockUser;
    private Food mockFood;
    private Review mockReview;

    @BeforeEach
    void setUp() {
        // Explicitly inject the mock EntityManager into the private field
        ReflectionTestUtils.setField(reviewController, "entityManager", entityManager);

        mockUserId = UUID.randomUUID();
        mockUser = new User();
        mockFood = new Food();

        mockReview = new Review();
        mockReview.setId(UUID.randomUUID());
        mockReview.setUser(mockUser);
        mockReview.setFood(mockFood);
        mockReview.setRating(5);
        mockReview.setComment("Great meal!");
    }

    // ==========================================
    // GET /api/reviews/food/{foodId}
    // ==========================================
    @Nested
    @DisplayName("GET /api/reviews/food/{foodId}")
    class GetReviewsByFoodTests {

        @Test
        @DisplayName("Should return list of reviews for a food ID")
        void shouldReturnReviewsForFoodId() {
            Long foodId = 10L;
            given(reviewRepository.findByFoodId(foodId)).willReturn(List.of(mockReview));

            List<Review> result = reviewController.getReviews(foodId);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals(5, result.get(0).getRating());
            verify(reviewRepository).findByFoodId(foodId);
        }
    }

    // ==========================================
    // POST /api/reviews (createReview)
    // ==========================================
    @Nested
    @DisplayName("POST /api/reviews")
    class CreateReviewTests {

        @Test
        @DisplayName("Should successfully create review when input and auth are valid")
        void shouldCreateReviewSuccessfully() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(10L);
            request.setRating(4);
            request.setComment("Very tasty!");

            given(authentication.getName()).willReturn(mockUserId.toString());
            given(entityManager.find(User.class, mockUserId)).willReturn(mockUser);
            given(entityManager.find(Food.class, 10L)).willReturn(mockFood);
            given(reviewRepository.save(any(Review.class))).willReturn(mockReview);

            Map<String, Object> response = reviewController.createReview(request, authentication);

            assertNotNull(response);
            assertEquals("Review submitted successfully", response.get("message"));
            assertEquals(mockReview.getId().toString(), response.get("id"));
            verify(reviewRepository).save(any(Review.class));
        }

        @Test
        @DisplayName("Should throw 401 UNAUTHORIZED when authentication is missing or null")
        void shouldThrowUnauthorizedWhenNoAuth() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(10L);
            request.setRating(5);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.createReview(request, null));

            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
            assertTrue(ex.getReason().contains("User is not authenticated"));
        }

        @Test
        @DisplayName("Should throw 400 BAD_REQUEST when rating is out of bounds (< 1 or > 5)")
        void shouldThrowBadRequestWhenRatingInvalid() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(10L);
            request.setRating(6);

            given(authentication.getName()).willReturn(mockUserId.toString());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.createReview(request, authentication));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("Rating must be between 1 and 5"));
        }

        @Test
        @DisplayName("Should throw 400 BAD_REQUEST when foodId is null")
        void shouldThrowBadRequestWhenFoodIdNull() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(null);
            request.setRating(3);

            given(authentication.getName()).willReturn(mockUserId.toString());

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.createReview(request, authentication));

            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
            assertTrue(ex.getReason().contains("foodId cannot be null"));
        }

        @Test
        @DisplayName("Should throw 404 NOT_FOUND when User is not found in database")
        void shouldThrowNotFoundWhenUserMissing() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(10L);
            request.setRating(4);

            given(authentication.getName()).willReturn(mockUserId.toString());
            given(entityManager.find(User.class, mockUserId)).willReturn(null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.createReview(request, authentication));

            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            assertTrue(ex.getReason().contains("User not found"));
        }

        @Test
        @DisplayName("Should throw 404 NOT_FOUND when Food item is not found in database")
        void shouldThrowNotFoundWhenFoodMissing() {
            ReviewController.ReviewRequest request = new ReviewController.ReviewRequest();
            request.setFoodId(999L);
            request.setRating(4);

            given(authentication.getName()).willReturn(mockUserId.toString());
            given(entityManager.find(User.class, mockUserId)).willReturn(mockUser);
            given(entityManager.find(Food.class, 999L)).willReturn(null);

            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.createReview(request, authentication));

            assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
            assertTrue(ex.getReason().contains("Food listing not found"));
        }
    }

    // ==========================================
    // GET /api/reviews/my-reviews
    // ==========================================
    @Nested
    @DisplayName("GET /api/reviews/my-reviews")
    class GetMyReviewsTests {

        @Test
        @DisplayName("Should return current user's reviews when authenticated")
        void shouldReturnUserReviews() {
            given(authentication.getName()).willReturn(mockUserId.toString());
            given(reviewRepository.findByUserId(mockUserId)).willReturn(List.of(mockReview));

            List<Review> results = reviewController.getMyReviews(authentication);

            assertNotNull(results);
            assertEquals(1, results.size());
            verify(reviewRepository).findByUserId(mockUserId);
        }

        @Test
        @DisplayName("Should throw 401 UNAUTHORIZED if not authenticated")
        void shouldThrowUnauthorizedWhenUnauthenticated() {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> reviewController.getMyReviews(null));

            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }
    }
}