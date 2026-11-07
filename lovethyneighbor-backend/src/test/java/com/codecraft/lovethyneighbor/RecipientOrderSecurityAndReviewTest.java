package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RecipientOrderSecurityAndReviewTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private Authentication authentication;

    private RecipientOrderController recipientOrderController;
    private final UUID recipientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        recipientOrderController = new RecipientOrderController(foodRepository, reviewRepository);
        when(authentication.getName()).thenReturn(recipientId.toString());
    }

    @Test
    @DisplayName("Progressive Address Disclosure: Street address is locked when claim is pending approval")
    void testAddressLockedWhenClaimedPending() {
        Food pendingFood = new Food();
        pendingFood.setId(101L);
        pendingFood.setFoodItem("Fresh Soup");
        pendingFood.setAddress("123 Secret Home St, Sacramento, CA");
        pendingFood.setStatus("CLAIMED");
        pendingFood.setClaimedByUserId(recipientId);

        when(foodRepository.findByClaimedByUserId(recipientId)).thenReturn(List.of(pendingFood));
        when(reviewRepository.findByFoodId(101L)).thenReturn(Collections.emptyList());

        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        assertEquals(1, orders.size());
        RecipientOrderResponse order = orders.get(0);
        assertTrue(order.getAddress().contains("Locked until donor approves"));
        assertNull(order.getDirectionsUrl());
        assertFalse(order.isReviewEligible());
    }

    @Test
    @DisplayName("Progressive Address Disclosure & Directions Link: Full address and map link revealed when SCHEDULED")
    void testAddressAndDirectionsRevealedWhenApproved() {
        Food approvedFood = new Food();
        approvedFood.setId(102L);
        approvedFood.setFoodItem("Warm Meals");
        approvedFood.setAddress("6000 J St, Sacramento, CA 95819");
        approvedFood.setStatus("SCHEDULED");
        approvedFood.setClaimedByUserId(recipientId);

        when(foodRepository.findByClaimedByUserId(recipientId)).thenReturn(List.of(approvedFood));
        when(reviewRepository.findByFoodId(102L)).thenReturn(Collections.emptyList());

        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        assertEquals(1, orders.size());
        RecipientOrderResponse order = orders.get(0);
        assertEquals("6000 J St, Sacramento, CA 95819", order.getAddress());
        assertNotNull(order.getDirectionsUrl());
        assertTrue(order.getDirectionsUrl().startsWith("https://www.google.com/maps/dir/"));
        assertTrue(order.getDirectionsUrl().contains("6000+J+St"));
    }

    @Test
    @DisplayName("Review eligibility: Completed order within 72 hours is eligible for review")
    void testReviewEligibleWithin72Hours() {
        Food completedFood = new Food();
        completedFood.setId(103L);
        completedFood.setFoodItem("Apples");
        completedFood.setStatus("COMPLETED");
        completedFood.setClaimedByUserId(recipientId);
        completedFood.setCompletedAt(LocalDateTime.now().minusHours(24)); // 24 hours ago (< 72h)

        when(foodRepository.findByClaimedByUserId(recipientId)).thenReturn(List.of(completedFood));
        when(reviewRepository.findByFoodId(103L)).thenReturn(Collections.emptyList());

        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        assertEquals(1, orders.size());
        RecipientOrderResponse order = orders.get(0);
        assertTrue(order.isReviewEligible());
        assertEquals("Eligible for review.", order.getReviewEligibilityMessage());
    }

    @Test
    @DisplayName("Review eligibility: Completed order past 72 hours is expired and ineligible")
    void testReviewIneligiblePast72Hours() {
        Food expiredFood = new Food();
        expiredFood.setId(104L);
        expiredFood.setFoodItem("Bread");
        expiredFood.setStatus("COMPLETED");
        expiredFood.setClaimedByUserId(recipientId);
        expiredFood.setCompletedAt(LocalDateTime.now().minusHours(80)); // 80 hours ago (> 72h)

        when(foodRepository.findByClaimedByUserId(recipientId)).thenReturn(List.of(expiredFood));
        when(reviewRepository.findByFoodId(104L)).thenReturn(Collections.emptyList());

        List<RecipientOrderResponse> orders = recipientOrderController.getRecipientOrders(authentication);

        assertEquals(1, orders.size());
        RecipientOrderResponse order = orders.get(0);
        assertFalse(order.isReviewEligible());
        assertTrue(order.getReviewEligibilityMessage().contains("expired"));
    }
}
