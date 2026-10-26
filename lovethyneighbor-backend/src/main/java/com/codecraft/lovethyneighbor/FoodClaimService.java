package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

// Shared logic for a recipient claiming (requesting) a food listing.
// Both POST /api/orders/{foodId} and POST /api/food/{id}/request go through here,
// so every claim creates an order and the pickup cooldown (DT-51) can't be skipped.
@Service
public class FoodClaimService {

    private final FoodRepository foodRepository;
    private final FoodOrderRepository foodOrderRepository;
    private final NotificationRepository notificationRepository;
    private final Duration cooldown;
    private final Clock clock;

    @Autowired
    public FoodClaimService(
            FoodRepository foodRepository,
            FoodOrderRepository foodOrderRepository,
            NotificationRepository notificationRepository,
            @Value("${app.claims.cooldown-hours:24}") long cooldownHours) {
        this(foodRepository, foodOrderRepository, notificationRepository,
                Duration.ofHours(cooldownHours), Clock.systemDefaultZone());
    }

    // Lets tests pick the cooldown length and the current time
    FoodClaimService(
            FoodRepository foodRepository,
            FoodOrderRepository foodOrderRepository,
            NotificationRepository notificationRepository,
            Duration cooldown,
            Clock clock) {
        this.foodRepository = foodRepository;
        this.foodOrderRepository = foodOrderRepository;
        this.notificationRepository = notificationRepository;
        this.cooldown = cooldown;
        this.clock = clock;
    }

    public Duration getCooldown() {
        return cooldown;
    }

    // When the recipient may request again, or empty if they can request now
    public Optional<LocalDateTime> nextClaimAllowedAt(UUID recipientId) {
        // A request the donor declined doesn't count, so the recipient can try something else right away
        return foodOrderRepository.findFirstByRecipientIdAndStatusNotIgnoreCaseOrderByCreatedAtDesc(recipientId, "cancelled")
                .map(FoodOrder::getCreatedAt)
                .map(lastClaim -> lastClaim.plus(cooldown))
                .filter(allowedAt -> allowedAt.isAfter(LocalDateTime.now(clock)));
    }

    @Transactional
    public Claim claim(Long foodId, UUID recipientId) {
        Food food = foodRepository.findById(foodId)
                .orElseThrow(() -> new ClaimException(HttpStatus.NOT_FOUND, "Food listing not found."));

        if (!"ACTIVE".equalsIgnoreCase(food.getStatus())) {
            throw new ClaimException(HttpStatus.BAD_REQUEST, "This food is no longer available.");
        }

        // DT-87: the expiry check runs every few minutes, so also refuse once the window has passed
        if (food.getPickupEndTime() != null && food.getPickupEndTime().isBefore(LocalDateTime.now(clock))) {
            throw new ClaimException(HttpStatus.BAD_REQUEST, "This food's pickup window has ended.");
        }

        if (recipientId.equals(food.getUserId())) {
            throw new ClaimException(HttpStatus.BAD_REQUEST, "You cannot request your own listing.");
        }

        if (foodOrderRepository.existsByFoodIdAndRecipientId(foodId, recipientId)) {
            throw new ClaimException(HttpStatus.BAD_REQUEST, "You already requested this food.");
        }

        // DT-51: one request per cooldown window, so one person can't claim everything
        Optional<LocalDateTime> nextAllowed = nextClaimAllowedAt(recipientId);
        if (nextAllowed.isPresent()) {
            throw new ClaimException(HttpStatus.TOO_MANY_REQUESTS,
                    "To keep things fair, you can request food once every " + describe(cooldown)
                            + ". You can request again in "
                            + describe(Duration.between(LocalDateTime.now(clock), nextAllowed.get())) + ".");
        }

        FoodOrder order = new FoodOrder();
        order.setFoodId(foodId);
        order.setRecipientId(recipientId);
        order.setStatus("pending");
        order.setCreatedAt(LocalDateTime.now(clock));
        FoodOrder savedOrder = foodOrderRepository.save(order);

        // Update food status to CLAIMED and assign claimedByUserId (DT-96)
        food.setStatus("CLAIMED");
        food.setClaimedByUserId(recipientId);
        Food savedFood = foodRepository.save(food);

        // Notify donor (DT-73)
        notificationRepository.save(new Notification(
                food.getUserId(),
                food.getId(),
                "REQUEST_RECEIVED",
                "New Request for " + food.getFoodItem(),
                "A recipient has requested your listing '" + food.getFoodItem() + "'. Click to coordinate pickup."
        ));

        return new Claim(savedFood, savedOrder);
    }

    // Keeps the recipient's order in step with the listing as the pickup moves along
    public void updateOrderStatus(Food food, String status) {
        if (food.getClaimedByUserId() == null) {
            return;
        }
        for (FoodOrder order : foodOrderRepository.findByFoodIdAndRecipientId(food.getId(), food.getClaimedByUserId())) {
            order.setStatus(status);
            foodOrderRepository.save(order);
        }
    }

    // "5 hours 12 minutes", "24 hours", "45 minutes"
    static String describe(Duration duration) {
        long totalMinutes = Math.max(1, (duration.toSeconds() + 59) / 60);
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        StringBuilder text = new StringBuilder();
        if (hours > 0) {
            text.append(hours).append(hours == 1 ? " hour" : " hours");
        }
        if (minutes > 0) {
            if (text.length() > 0) {
                text.append(' ');
            }
            text.append(minutes).append(minutes == 1 ? " minute" : " minutes");
        }
        return text.toString();
    }

    public record Claim(Food food, FoodOrder order) {}

    public static class ClaimException extends RuntimeException {
        private final HttpStatus status;

        public ClaimException(HttpStatus status, String message) {
            super(message);
            this.status = status;
        }

        public HttpStatus getStatus() {
            return status;
        }
    }
}
