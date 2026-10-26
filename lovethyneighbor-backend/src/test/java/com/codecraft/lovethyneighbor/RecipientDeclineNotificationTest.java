package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// DT-76: mock repositories keep these tests independent of the shared database.
@ExtendWith(MockitoExtension.class)
class RecipientDeclineNotificationTest {

    @Mock private FoodRepository foodRepository;
    @Mock private FoodOrderRepository foodOrderRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private FoodOrderController controller;

    private Food food;
    private UUID donorId;
    private UUID recipientId;
    private TestingAuthenticationToken donor;

    // Each test starts with a fresh pending claim belonging to a known donor.
    @BeforeEach
    void setUp() {
        donorId = UUID.randomUUID();
        recipientId = UUID.randomUUID();
        donor = new TestingAuthenticationToken(donorId.toString(), null);
        food = new Food();
        food.setId(501L);
        food.setFoodItem("Bagels");
        food.setUserId(donorId);
        food.setClaimedByUserId(recipientId);
        food.setStatus("CLAIMED");
    }

    private FoodOrder order(long foodId, String status) {
        FoodOrder order = new FoodOrder();
        order.setFoodId(foodId);
        order.setRecipientId(recipientId);
        order.setStatus(status);
        return order;
    }

    // A real decline releases the listing and notifies the original recipient.
    // Existing history is cancelled; unrelated or completed orders stay intact.
    @Test
    void declineNotifiesRecipientAndReleasesListing() {
        FoodOrder matching = order(501L, "pending");
        FoodOrder unrelated = order(502L, "pending");
        FoodOrder completed = order(501L, "completed");
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));
        when(foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId))
                .thenReturn(List.of(matching, unrelated, completed));

        assertEquals(200, controller.declineRequest(501L, donor).getStatusCode().value());
        assertEquals("ACTIVE", food.getStatus());
        assertNull(food.getClaimedByUserId());
        assertEquals("cancelled", matching.getStatus());
        assertEquals("pending", unrelated.getStatus());
        assertEquals("completed", completed.getStatus());
        verify(foodOrderRepository).save(matching);
        verify(foodOrderRepository, never()).save(unrelated);
        verify(foodOrderRepository, never()).save(completed);

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        Notification notification = saved.getValue();
        assertEquals(recipientId, notification.getUserId());
        assertEquals(Long.valueOf(501L), notification.getFoodId());
        assertEquals("REQUEST_DECLINED", notification.getType());
        assertEquals("Request Declined: Bagels", notification.getTitle());
        assertTrue(notification.getMessage().contains("declined by the donor"));
        assertFalse(notification.isRead());
    }

    // The older request endpoint creates a claim without an order row.
    // Decline must still work and must not attempt to save a nonexistent order.
    @Test
    void declineWorksWithoutAnOrderRecord() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));
        when(foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)).thenReturn(List.of());
        assertEquals(200, controller.declineRequest(501L, donor).getStatusCode().value());
        verify(foodOrderRepository, never()).save(any(FoodOrder.class));
        verify(notificationRepository).save(any(Notification.class));
    }

    // Repeating a successful decline sequentially must not send another message.
    @Test
    void repeatedDeclineDoesNotCreateDuplicateNotifications() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));
        when(foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)).thenReturn(List.of());
        assertEquals(200, controller.declineRequest(501L, donor).getStatusCode().value());
        assertEquals(409, controller.declineRequest(501L, donor).getStatusCode().value());
        verify(foodRepository).save(food);
        verify(notificationRepository).save(any(Notification.class));
    }

    // Neither the requesting recipient nor another donor owns this listing.
    // Both must receive 403 without any order changes or notifications.
    @Test
    void otherUsersCannotDecline() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        for (UUID userId : List.of(recipientId, UUID.randomUUID())) {
            assertEquals(403, controller.declineRequest(501L,
                    new TestingAuthenticationToken(userId.toString(), null)).getStatusCode().value());
        }
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(foodOrderRepository, notificationRepository);
    }

    // Scheduled, completed, available, and removed listings are not pending claims.
    @Test
    void invalidStatusesDoNotChangeAnything() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        for (String status : new String[] {"ACTIVE", "SCHEDULED", "COMPLETED", "REMOVED_BY_ADMIN"}) {
            food.setStatus(status);
            assertEquals(409, controller.declineRequest(501L, donor).getStatusCode().value());
            assertEquals(status, food.getStatus());
        }
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(foodOrderRepository, notificationRepository);
    }

    // A broken claim without a recipient must not send a notification to anyone.
    @Test
    void missingRecipientIsRejected() {
        food.setClaimedByUserId(null);
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        assertEquals(409, controller.declineRequest(501L, donor).getStatusCode().value());
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(foodOrderRepository, notificationRepository);
    }

    // An unknown food ID returns 404 before changing orders or sending messages.
    @Test
    void missingFoodIsRejected() {
        when(foodRepository.findById(501L)).thenReturn(Optional.empty());
        assertEquals(404, controller.declineRequest(501L, donor).getStatusCode().value());
        verifyNoInteractions(foodOrderRepository, notificationRepository);
    }

    // No login must return 401 before accessing any repository.
    @Test
    void missingAuthenticationIsRejected() {
        assertEquals(401, controller.declineRequest(501L, null).getStatusCode().value());
        verifyNoInteractions(foodRepository, foodOrderRepository, notificationRepository);
    }

    // Invalid UUID login information must also be rejected before database access.
    @Test
    void invalidAuthenticationIsRejected() {
        assertEquals(401, controller.declineRequest(501L,
                new TestingAuthenticationToken("invalid-uuid", null)).getStatusCode().value());
        verifyNoInteractions(foodRepository, foodOrderRepository, notificationRepository);
    }
}
