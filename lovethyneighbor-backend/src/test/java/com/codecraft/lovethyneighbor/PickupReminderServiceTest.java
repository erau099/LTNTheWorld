package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PickupReminderServiceTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private PickupReminderService pickupReminderService;

    @Test
    void usesBoundedPickupWindowQueryAndCreatesRemindersOnce() {
        UUID donorId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();

        Food food = new Food(
                LocalDate.now(),
                LocalDateTime.now().plusMinutes(15),
                "Fresh Bread",
                "Artisan loaves",
                donorId,
                "Bakery",
                ""
        );
        food.setId(42L);
        food.setClaimedByUserId(recipientId);

        when(foodRepository.findByClaimedByUserIdIsNotNullAndPickupTimeBetween(any(), any()))
                .thenReturn(List.of(food));
        when(notificationRepository.existsByUserIdAndFoodIdAndType(recipientId, 42L, "PICKUP_REMINDER_RECIPIENT"))
                .thenReturn(false);
        when(notificationRepository.existsByUserIdAndFoodIdAndType(donorId, 42L, "PICKUP_REMINDER_DONOR"))
                .thenReturn(false);

        pickupReminderService.checkPickupReminders();

        verify(foodRepository, never()).findAll();
        verify(foodRepository).findByClaimedByUserIdIsNotNullAndPickupTimeBetween(any(), any());
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void skipsDuplicateRemindersWhenAlreadySent() {
        UUID donorId = UUID.randomUUID();
        UUID recipientId = UUID.randomUUID();

        Food food = new Food(
                LocalDate.now(),
                LocalDateTime.now().plusMinutes(10),
                "Apples",
                "Crisp apples",
                donorId,
                "Fresh / Hot",
                ""
        );
        food.setId(99L);
        food.setClaimedByUserId(recipientId);

        when(foodRepository.findByClaimedByUserIdIsNotNullAndPickupTimeBetween(any(), any()))
                .thenReturn(List.of(food));
        when(notificationRepository.existsByUserIdAndFoodIdAndType(eq(recipientId), eq(99L), eq("PICKUP_REMINDER_RECIPIENT")))
                .thenReturn(true);
        when(notificationRepository.existsByUserIdAndFoodIdAndType(eq(donorId), eq(99L), eq("PICKUP_REMINDER_DONOR")))
                .thenReturn(true);

        pickupReminderService.checkPickupReminders();

        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
