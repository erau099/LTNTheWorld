package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodOrderControllerTest {

    @Mock
    private FoodOrderRepository foodOrderRepository;

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private FoodClaimService foodClaimService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private FoodOrderController foodOrderController;

    private UUID donorId;
    private UUID recipientId;
    private Food food;

    @BeforeEach
    void setUp() {
        donorId = UUID.randomUUID();
        recipientId = UUID.randomUUID();

        food = new Food();
        food.setId(22L);
        food.setFoodItem("Vegetable Medley");
        food.setUserId(donorId);
        food.setClaimedByUserId(recipientId);
        food.setStatus("CLAIMED");
    }

    @Test
    @DisplayName("GET /api/orders/cooldown - Returns cooldown status")
    void shouldReturnCooldownStatus() {
        given(authentication.getName()).willReturn(recipientId.toString());
        given(foodClaimService.nextClaimAllowedAt(recipientId)).willReturn(Optional.empty());
        given(foodClaimService.getCooldown()).willReturn(Duration.ofHours(24));

        ResponseEntity<?> response = foodOrderController.getCooldown(authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) response.getBody();
        assertNotNull(body);
        assertEquals(true, body.get("canRequest"));
        assertEquals(24L, body.get("cooldownHours"));
    }

    @Test
    @DisplayName("PATCH /api/orders/food/{id}/decline-request - Successfully cancels order, resets food, and notifies recipient")
    void shouldDeclineRequestSuccessfully() {
        FoodOrder pendingOrder = new FoodOrder();
        pendingOrder.setId(1L);
        pendingOrder.setFoodId(22L);
        pendingOrder.setStatus("pending");

        given(authentication.getName()).willReturn(donorId.toString());
        given(foodRepository.findById(22L)).willReturn(Optional.of(food));
        given(foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)).willReturn(List.of(pendingOrder));
        given(foodRepository.save(any(Food.class))).willAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> response = foodOrderController.declineRequest(22L, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Food updated = (Food) response.getBody();
        assertNotNull(updated);
        assertEquals("ACTIVE", updated.getStatus());
        assertNull(updated.getClaimedByUserId());

        // Verify order status cancelled
        assertEquals("cancelled", pendingOrder.getStatus());
        verify(foodOrderRepository).save(pendingOrder);

        // Verify recipient was notified
        verify(notificationRepository).save(any(Notification.class));
    }

    // ==========================================
    // GET /api/orders/mine (Fetch recipient orders)
    // ==========================================

    @Test
    @DisplayName("GET /api/orders/mine - Should return orders for authenticated recipient")
    void shouldReturnRecipientOrdersWhenAuthenticated() {
        // Arrange
        UUID recipientId = UUID.randomUUID();
        FoodOrder order1 = new FoodOrder();
        order1.setId(1L);
        order1.setFoodId(101L);
        order1.setRecipientId(recipientId);
        order1.setStatus("pending");

        FoodOrder order2 = new FoodOrder();
        order2.setId(2L);
        order2.setFoodId(102L);
        order2.setRecipientId(recipientId);
        order2.setStatus("completed");

        given(authentication.getName()).willReturn(recipientId.toString());
        given(foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId))
                .willReturn(List.of(order1, order2));

        // Act
        ResponseEntity<?> response = foodOrderController.getMyOrders(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        List<FoodOrder> body = (List<FoodOrder>) response.getBody();
        assertNotNull(body);
        assertEquals(2, body.size());
        assertEquals(101L, body.get(0).getFoodId());
        verify(foodOrderRepository).findByRecipientIdOrderByCreatedAtDesc(recipientId);
    }

    @Test
    @DisplayName("GET /api/orders/mine - Should return 401 if unauthenticated")
    void shouldReturn401WhenGettingOrdersWithoutAuth() {
        // Act
        ResponseEntity<?> response = foodOrderController.getMyOrders(null);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("You must be logged in.", response.getBody());
        verify(foodOrderRepository, never()).findByRecipientIdOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("GET /api/orders/mine - Should return 401 if token has invalid UUID")
    void shouldReturn401WhenRecipientUuidMalformed() {
        // Arrange
        given(authentication.getName()).willReturn("not-a-valid-uuid");

        // Act
        ResponseEntity<?> response = foodOrderController.getMyOrders(authentication);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid user ID.", response.getBody());
    }
}