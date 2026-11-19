package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class RecipientOrderControllerTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private RecipientOrderController recipientOrderController;

    @Test
    @DisplayName("GET /api/recipient/orders - Enriches orders with review details and donor name")
    void shouldReturnRecipientOrdersWithReviews() {
        UUID recipientId = UUID.randomUUID();
        given(authentication.getName()).willReturn(recipientId.toString());

        User donor = new User();
        donor.setFirstName("Sarah");
        donor.setLastName("Connor");

        Food food = new Food();
        food.setId(10L);
        food.setFoodItem("Lasagna");
        food.setUser(donor);
        food.setDate(LocalDate.of(2026, 6, 15));
        food.setPickupTime(LocalDateTime.of(2026, 6, 15, 18, 30));
        food.setStatus("COMPLETED");

        Review review = new Review();
        review.setRating(5);
        review.setComment("Delicious!");

        given(foodRepository.findByClaimedByUserId(recipientId)).willReturn(List.of(food));
        given(reviewRepository.findByFoodId(10L)).willReturn(List.of(review));

        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        assertNotNull(orders);
        assertEquals(1, orders.size());
        RecipientOrderResponse item = orders.get(0);
        assertEquals("Sarah Connor", item.getDonor());
        assertEquals("Lasagna", item.getFood());
        assertTrue(item.isReviewed());
        assertEquals(5, item.getReviewRating());
        assertEquals("Delicious!", item.getReviewComment());
    }

    @Test
    @DisplayName("GET /api/recipient/orders - Falls back to 'Anonymous' donor and null review when missing")
    void shouldHandleMissingDonorAndReviewsGracefully() {
        // Arrange
        UUID recipientId = UUID.randomUUID();
        given(authentication.getName()).willReturn(recipientId.toString());

        Food foodWithoutDonorOrReviews = new Food();
        foodWithoutDonorOrReviews.setId(99L);
        foodWithoutDonorOrReviews.setFoodItem("Leftover Bread");
        foodWithoutDonorOrReviews.setUser(null); // No donor entity linked
        foodWithoutDonorOrReviews.setStatus("CLAIMED");

        given(foodRepository.findByClaimedByUserId(recipientId)).willReturn(List.of(foodWithoutDonorOrReviews));
        given(reviewRepository.findByFoodId(99L)).willReturn(List.of()); // No reviews

        // Act
        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        // Assert
        assertNotNull(orders);
        assertEquals(1, orders.size());
        RecipientOrderResponse item = orders.get(0);
        assertEquals("Anonymous", item.getDonor());
        assertFalse(item.isReviewed());
        assertNull(item.getReviewRating());
        assertNull(item.getReviewComment());
    }
}