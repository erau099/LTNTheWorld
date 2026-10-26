package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

// DT-87: listings nobody claimed before their pickup window ended are marked EXPIRED
// (so recipients stop seeing them) and the donor gets a notification.
@Service
public class ListingExpiryService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("MMM d 'at' h:mm a");

    private final FoodRepository foodRepository;
    private final NotificationRepository notificationRepository;
    private final Clock clock;

    @Autowired
    public ListingExpiryService(FoodRepository foodRepository, NotificationRepository notificationRepository) {
        this(foodRepository, notificationRepository, Clock.systemDefaultZone());
    }

    // Lets tests pick the current time
    ListingExpiryService(FoodRepository foodRepository, NotificationRepository notificationRepository, Clock clock) {
        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
        this.clock = clock;
    }

    // Runs every few minutes (app.listings.expiry-check-minutes, default 5)
    @Scheduled(
            initialDelayString = "PT30S",
            fixedDelayString = "PT${app.listings.expiry-check-minutes:5}M")
    @Transactional
    public int expireUnclaimedListings() {
        List<Food> expired = foodRepository.findByStatusIgnoreCaseAndPickupEndTimeBefore(
                "ACTIVE", LocalDateTime.now(clock));

        for (Food food : expired) {
            food.setStatus("EXPIRED");
            foodRepository.save(food);

            notificationRepository.save(new Notification(
                    food.getUserId(),
                    food.getId(),
                    "LISTING_EXPIRED",
                    "Listing Expired: " + food.getFoodItem(),
                    "Nobody claimed '" + food.getFoodItem() + "' before its pickup window ended on "
                            + food.getPickupEndTime().format(WHEN)
                            + ", so it is no longer shown to recipients. You can post it again with a new pickup time."
            ));
        }
        return expired.size();
    }
}
