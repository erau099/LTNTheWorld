package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// DT-87: unclaimed listings expire when their pickup window ends, and the donor is told
@ExtendWith(MockitoExtension.class)
class ListingExpiryServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 25, 18, 0);

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private NotificationRepository notificationRepository;

    private ListingExpiryService service;
    private final UUID donorId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        service = new ListingExpiryService(foodRepository, notificationRepository, clock);
    }

    @Test
    void expiresUnclaimedListingAndNotifiesDonor() {
        Food food = new Food(LocalDate.of(2026, 10, 25), NOW.minusHours(3), "Soup", "Pot of soup",
                donorId, "Fresh / Hot", "", "ACTIVE");
        food.setId(7L);
        food.setPickupEndTime(NOW.minusHours(1));
        when(foodRepository.findByStatusIgnoreCaseAndPickupEndTimeBefore("ACTIVE", NOW)).thenReturn(List.of(food));

        assertEquals(1, service.expireUnclaimedListings());

        assertEquals("EXPIRED", food.getStatus());
        verify(foodRepository).save(food);

        ArgumentCaptor<Notification> sent = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(sent.capture());
        assertEquals(donorId, sent.getValue().getUserId());
        assertEquals(7L, sent.getValue().getFoodId());
        assertEquals("LISTING_EXPIRED", sent.getValue().getType());
        assertTrue(sent.getValue().getTitle().contains("Soup"));
        assertTrue(sent.getValue().getMessage().contains("Oct 25 at 5:00 PM"), sent.getValue().getMessage());
    }

    @Test
    void doesNothingWhenNoListingHasExpired() {
        when(foodRepository.findByStatusIgnoreCaseAndPickupEndTimeBefore("ACTIVE", NOW)).thenReturn(List.of());

        assertEquals(0, service.expireUnclaimedListings());

        verify(foodRepository, never()).save(any());
        verifyNoInteractions(notificationRepository);
    }
}
