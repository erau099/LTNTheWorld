package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// DT-74: test remaining recipient status notifications using mocked repositories.
// DT-75 and DT-76 already cover approval and decline; completion is added here.
@ExtendWith(MockitoExtension.class)
class RecipientStatusNotificationTest {
    @Mock private FoodRepository foodRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private FoodController controller;

    private Food food;
    private UUID donorId;
    private UUID recipientId;
    private TestingAuthenticationToken donor;

    // Each test starts with a fresh, scheduled pickup and its two participants.
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
        food.setStatus("SCHEDULED");
    }

    private void stubFood() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
    }

    private void stubSave() {
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));
    }

    // Completion preserves the donor's message and creates one unread recipient
    // message with the correct food ID, food name, and completion wording.
    @Test
    void donorCompletionNotifiesBothParticipants() {
        stubFood();
        stubSave();
        assertEquals(200, controller.completePickup(501L, donor).getStatusCode().value());
        assertEquals("COMPLETED", food.getStatus());
        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(saved.capture());
        var messages = saved.getAllValues();
        assertEquals(1L, messages.stream().filter(item -> donorId.equals(item.getUserId())).count());
        assertEquals(1L, messages.stream().filter(item -> recipientId.equals(item.getUserId())).count());
        Notification recipientMessage = messages.stream()
                .filter(item -> recipientId.equals(item.getUserId())).findFirst().orElseThrow();
        assertEquals("PICKUP_COMPLETED", recipientMessage.getType());
        assertEquals(Long.valueOf(501L), recipientMessage.getFoodId());
        assertEquals("Pickup Completed: Bagels", recipientMessage.getTitle());
        assertTrue(recipientMessage.getMessage().contains("marked as completed"));
        assertFalse(recipientMessage.isRead());
    }

    // The existing API allows the requesting recipient to complete pickup too.
    // Both participants must still receive their notification in that case.
    @Test
    void recipientCanCompletePickup() {
        stubFood();
        stubSave();
        var recipient = new TestingAuthenticationToken(recipientId.toString(), null);
        assertEquals(200, controller.completePickup(501L, recipient).getStatusCode().value());
        assertEquals("COMPLETED", food.getStatus());
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    // Refresh/retry after completion cannot send another pair of notifications.
    @Test
    void repeatedCompletionDoesNotDuplicateNotifications() {
        stubFood();
        stubSave();
        assertEquals(200, controller.completePickup(501L, donor).getStatusCode().value());
        assertEquals(409, controller.completePickup(501L, donor).getStatusCode().value());
        verify(foodRepository).save(food);
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    // An unrelated account gets 403 with no state changes or notifications.
    @Test
    void unrelatedUserCannotCompletePickup() {
        stubFood();
        var stranger = new TestingAuthenticationToken(UUID.randomUUID().toString(), null);
        assertEquals(403, controller.completePickup(501L, stranger).getStatusCode().value());
        assertEquals("SCHEDULED", food.getStatus());
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // ACTIVE/CLAIMED pickups cannot skip scheduling; completed/removed listings
    // cannot be completed again. Every rejected transition returns 409.
    @Test
    void invalidStatusesDoNotSendNotifications() {
        stubFood();
        for (String status : new String[] {"ACTIVE", "CLAIMED", "COMPLETED", "REMOVED_BY_ADMIN"}) {
            food.setStatus(status);
            assertEquals(409, controller.completePickup(501L, donor).getStatusCode().value());
            assertEquals(status, food.getStatus());
        }
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // A missing recipient is inconsistent pickup data and must not be saved.
    @Test
    void missingRecipientIsRejected() {
        stubFood();
        food.setClaimedByUserId(null);
        assertEquals(409, controller.completePickup(501L, donor).getStatusCode().value());
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // Unknown IDs return 404 without sending any notification.
    @Test
    void missingListingIsRejected() {
        when(foodRepository.findById(501L)).thenReturn(Optional.empty());
        assertEquals(404, controller.completePickup(501L, donor).getStatusCode().value());
        verifyNoInteractions(notificationRepository);
    }

    // Requests without login return 401 before accessing repository data.
    @Test
    void missingAuthenticationIsRejected() {
        assertEquals(401, controller.completePickup(501L, null).getStatusCode().value());
        verifyNoInteractions(foodRepository, notificationRepository);
    }

    // Invalid user UUIDs also return 401 before any repository access.
    @Test
    void invalidAuthenticationIsRejected() {
        var invalid = new TestingAuthenticationToken("invalid-uuid", null);
        assertEquals(401, controller.completePickup(501L, invalid).getStatusCode().value());
        verifyNoInteractions(foodRepository, notificationRepository);
    }
}
