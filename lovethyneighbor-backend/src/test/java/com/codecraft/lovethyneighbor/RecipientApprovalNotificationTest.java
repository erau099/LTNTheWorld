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

// Tests for DT-75. Testing for approval notifications using mocked repositories.
// These tests do not connect to or modify the shared database
@ExtendWith(MockitoExtension.class)
class RecipientApprovalNotificationTest {

    // Mockito replaces the database repositories with controllable test objects
    @Mock private FoodRepository foodRepository;
    @Mock private NotificationRepository notificationRepository;
    @InjectMocks private FoodController controller;

    private Food food;
    private UUID donorId;
    private UUID recipientId;
    private TestingAuthenticationToken donor;

    // Give every test a fresh donor, recipient, and pending food request
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

    // Checks a successful approval: the listing becomes SCHEDULED, the donor keeps
    // their pickup notification, and the requesting recipient gets an unread
    // REQUEST_APPROVED notification with the correct food ID and message.
    @Test
    void approvalNotifiesTheRequestingRecipientAndKeepsDonorNotification() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));

        assertEquals(200, controller.confirmPickup(501L, donor).getStatusCode().value());
        assertEquals("SCHEDULED", food.getStatus());

        // Capture both saved notifications so we can inspect who receives each one.
        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(saved.capture());
        var messages = saved.getAllValues();
        Notification donorMessage = messages.stream()
                .filter(item -> donorId.equals(item.getUserId())).findFirst().orElseThrow();
        assertEquals("PICKUP_SCHEDULED", donorMessage.getType());
        Notification recipientMessage = messages.stream()
                .filter(item -> recipientId.equals(item.getUserId())).findFirst().orElseThrow();
        assertEquals("REQUEST_APPROVED", recipientMessage.getType());
        assertEquals(Long.valueOf(501L), recipientMessage.getFoodId());
        assertEquals("Request Approved: Bagels", recipientMessage.getTitle());
        assertTrue(recipientMessage.getMessage().contains("Bagels"));
        assertFalse(recipientMessage.isRead());
    }

    // Confirms the same request twice in sequence. The first attempt succeeds;
    // the second returns 409 (conflict) without saving extra notifications.
    @Test
    void repeatedApprovalDoesNotCreateMoreNotifications() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(call -> call.getArgument(0));

        assertEquals(200, controller.confirmPickup(501L, donor).getStatusCode().value());
        assertEquals(409, controller.confirmPickup(501L, donor).getStatusCode().value());
        verify(foodRepository).save(food);
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    // Checks that a user who does not own the listing receives 403 (forbidden).
    // The listing must stay CLAIMED and no notifications should be saved.
    @Test
    void unrelatedUserCannotApproveOrSendNotifications() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        var stranger = new TestingAuthenticationToken(UUID.randomUUID().toString(), null);
        assertEquals(403, controller.confirmPickup(501L, stranger).getStatusCode().value());
        assertEquals("CLAIMED", food.getStatus());
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // Checks that the requesting recipient cannot approve the donor's listing.
    // Approval belongs to the listing owner, so the recipient receives 403.
    @Test
    void recipientCannotApproveTheirOwnRequest() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        var recipient = new TestingAuthenticationToken(recipientId.toString(), null);
        assertEquals(403, controller.confirmPickup(501L, recipient).getStatusCode().value());
        verifyNoInteractions(notificationRepository);
    }

    // Checks a CLAIMED listing with no requesting recipient. Approval must
    // return 409 without scheduling the pickup or saving notifications.
    @Test
    void missingRecipientDoesNotScheduleOrSendNotifications() {
        food.setClaimedByUserId(null);
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        assertEquals(409, controller.confirmPickup(501L, donor).getStatusCode().value());
        assertEquals("CLAIMED", food.getStatus());
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // Checks that only CLAIMED listings can be approved. ACTIVE, SCHEDULED,
    // COMPLETED, and admin-removed listings must return 409 without changes.
    @Test
    void unavailableOrCompletedListingsCannotBeApproved() {
        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        for (String status : new String[] {"ACTIVE", "SCHEDULED", "COMPLETED", "REMOVED_BY_ADMIN"}) {
            food.setStatus(status);
            assertEquals(409, controller.confirmPickup(501L, donor).getStatusCode().value());
            assertEquals(status, food.getStatus());
        }
        verify(foodRepository, never()).save(any(Food.class));
        verifyNoInteractions(notificationRepository);
    }

    // Checks an ID that does not exist. The controller must return
    // 404 (not found) and must not save any notification.
    @Test
    void missingListingDoesNotSendNotifications() {
        when(foodRepository.findById(501L)).thenReturn(Optional.empty());
        assertEquals(404, controller.confirmPickup(501L, donor).getStatusCode().value());
        verifyNoInteractions(notificationRepository);
    }

    // Checks a request without login information. It must return
    // 401 (unauthorized) before accessing either repository.
    @Test
    void missingAuthenticationDoesNotReadOrWriteData() {
        assertEquals(401, controller.confirmPickup(501L, null).getStatusCode().value());
        verifyNoInteractions(foodRepository, notificationRepository);
    }

    // Checks login information containing an invalid UUID. It must return
    // 401 before reading or writing repository data.
    @Test
    void invalidAuthenticationDoesNotReadOrWriteData() {
        var invalid = new TestingAuthenticationToken("invalid-uuid", null);
        assertEquals(401, controller.confirmPickup(501L, invalid).getStatusCode().value());
        verifyNoInteractions(foodRepository, notificationRepository);
    }
}
