package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// DT-51: pickup cooldown, and DT-261: order status kept in step with the pickup
@ExtendWith(MockitoExtension.class)
class FoodClaimServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 25, 12, 0);

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private FoodOrderRepository foodOrderRepository;

    @Mock
    private NotificationRepository notificationRepository;

    private FoodClaimService service;
    private final UUID donorId = UUID.randomUUID();
    private final UUID recipientId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new FoodClaimService(foodRepository, foodOrderRepository, notificationRepository,
                Duration.ofHours(24), clock);
    }

    private Food activeFood(long id) {
        Food food = new Food(LocalDate.now(), NOW, "Bagels", "Dozen", donorId, "Bakery", "", "ACTIVE");
        food.setId(id);
        when(foodRepository.findById(id)).thenReturn(Optional.of(food));
        return food;
    }

    private void lastOrderAt(LocalDateTime when) {
        FoodOrder previous = new FoodOrder();
        previous.setCreatedAt(when);
        when(foodOrderRepository.findFirstByRecipientIdAndStatusNotIgnoreCaseOrderByCreatedAtDesc(recipientId, "cancelled"))
                .thenReturn(Optional.of(previous));
    }

    @Test
    void firstRequestIsAllowedAndCreatesAnOrder() {
        Food food = activeFood(1L);
        when(foodOrderRepository.save(any(FoodOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(foodRepository.save(any(Food.class))).thenAnswer(i -> i.getArgument(0));

        FoodClaimService.Claim claim = service.claim(1L, recipientId);

        assertEquals("CLAIMED", food.getStatus());
        assertEquals(recipientId, food.getClaimedByUserId());
        assertEquals(recipientId, claim.order().getRecipientId());
        assertEquals(NOW, claim.order().getCreatedAt());
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void secondRequestInsideCooldownIsRejected() {
        Food food = activeFood(2L);
        lastOrderAt(NOW.minusHours(18).minusMinutes(48));

        FoodClaimService.ClaimException e =
                assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(2L, recipientId));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, e.getStatus());
        assertTrue(e.getMessage().contains("once every 24 hours"), e.getMessage());
        assertTrue(e.getMessage().contains("5 hours 12 minutes"), e.getMessage());
        assertEquals("ACTIVE", food.getStatus());
        verify(foodOrderRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void requestAfterCooldownIsAllowed() {
        activeFood(3L);
        lastOrderAt(NOW.minusHours(24));
        when(foodOrderRepository.save(any(FoodOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(foodRepository.save(any(Food.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> service.claim(3L, recipientId));
    }

    @Test
    void nextClaimAllowedAtReportsWhenTheWaitEnds() {
        lastOrderAt(NOW.minusHours(2));
        assertEquals(Optional.of(NOW.plusHours(22)), service.nextClaimAllowedAt(recipientId));

        lastOrderAt(NOW.minusHours(30));
        assertEquals(Optional.empty(), service.nextClaimAllowedAt(recipientId));
    }

    @Test
    void unavailableOwnAndDuplicateRequestsAreRejected() {
        Food claimed = new Food(LocalDate.now(), NOW, "Soup", "Pot", donorId, "Fresh / Hot", "", "CLAIMED");
        claimed.setId(4L);
        when(foodRepository.findById(4L)).thenReturn(Optional.of(claimed));
        assertEquals(HttpStatus.BAD_REQUEST,
                assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(4L, recipientId)).getStatus());

        activeFood(5L);
        assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(5L, donorId));

        when(foodOrderRepository.existsByFoodIdAndRecipientId(5L, recipientId)).thenReturn(true);
        assertTrue(assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(5L, recipientId))
                .getMessage().contains("already requested"));

        when(foodRepository.findById(99L)).thenReturn(Optional.empty());
        assertEquals(HttpStatus.NOT_FOUND,
                assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(99L, recipientId)).getStatus());
    }

    @Test
    void requestAfterPickupWindowEndedIsRejected() {
        Food food = activeFood(8L);
        food.setPickupEndTime(NOW.minusMinutes(1));

        FoodClaimService.ClaimException e =
                assertThrows(FoodClaimService.ClaimException.class, () -> service.claim(8L, recipientId));

        assertTrue(e.getMessage().contains("pickup window has ended"));
        verify(foodOrderRepository, never()).save(any());
    }

    @Test
    void orderStatusFollowsThePickup() {
        Food food = new Food(LocalDate.now(), NOW, "Bagels", "Dozen", donorId, "Bakery", "", "SCHEDULED");
        food.setId(6L);
        food.setClaimedByUserId(recipientId);
        FoodOrder order = new FoodOrder();
        when(foodOrderRepository.findByFoodIdAndRecipientId(6L, recipientId)).thenReturn(List.of(order));

        service.updateOrderStatus(food, "scheduled");

        assertEquals("scheduled", order.getStatus());
        verify(foodOrderRepository).save(order);
    }

    @Test
    void describeFormatsDurations() {
        assertEquals("24 hours", FoodClaimService.describe(Duration.ofHours(24)));
        assertEquals("1 hour 1 minute", FoodClaimService.describe(Duration.ofMinutes(61)));
        assertEquals("45 minutes", FoodClaimService.describe(Duration.ofMinutes(45)));
        assertEquals("1 minute", FoodClaimService.describe(Duration.ofSeconds(5)));
    }
}
