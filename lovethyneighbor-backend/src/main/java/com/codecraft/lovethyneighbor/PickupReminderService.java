package com.codecraft.lovethyneighbor;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class PickupReminderService {

    private final FoodRepository foodRepository;
    private final NotificationRepository notificationRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private FcmPushService fcmPushService;

    public PickupReminderService(
            FoodRepository foodRepository,
            NotificationRepository notificationRepository) {

        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void checkPickupReminders() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderLimit = now.plusMinutes(30);

        List<Food> foods = foodRepository.findByClaimedByUserIdIsNotNullAndPickupTimeBetween(now, reminderLimit);

        for (Food food : foods) {

            String status = food.getStatus();
            if ("COMPLETED".equalsIgnoreCase(status)
                    || "EXPIRED".equalsIgnoreCase(status)
                    || "UNAVAILABLE".equalsIgnoreCase(status)
                    || "ARCHIVED".equalsIgnoreCase(status)
                    || "REMOVED_BY_ADMIN".equalsIgnoreCase(status)) {
                continue;
            }

            if (food.getPickupTime() == null) {
                continue;
            }

            UUID recipientId = food.getClaimedByUserId();

            if (recipientId == null) {
                continue;
            }

            LocalDateTime pickupTime = food.getPickupTime();

            // Pickup has already passed
            if (pickupTime.isBefore(now)) {
                continue;
            }

            // Pickup is more than 30 minutes away
            if (pickupTime.isAfter(reminderLimit)) {
                continue;
            }

            createRecipientReminder(food, recipientId);
            createDonorReminder(food);
        }
    }

    private void createRecipientReminder(Food food, UUID recipientId) {

        String type = "PICKUP_REMINDER_RECIPIENT";

        boolean alreadyExists =
                notificationRepository.existsByUserIdAndFoodIdAndType(
                        recipientId,
                        food.getId(),
                        type
                );

        if (alreadyExists) {
            return;
        }

        String pickupTime = formatPickupTime(food.getPickupTime());

        Notification notification = new Notification(
                recipientId,
                food.getId(),
                type,
                "Pickup Reminder",
                "Your pickup for " + food.getFoodItem()
                        + " is coming up at " + pickupTime + "."
        );

        notificationRepository.save(notification);
        if (fcmPushService != null) {
            fcmPushService.sendToUser(recipientId, notification.getTitle(), notification.getMessage());
        }
    }

    private void createDonorReminder(Food food) {

        UUID donorId = food.getUserId();

        if (donorId == null) {
            return;
        }

        String type = "PICKUP_REMINDER_DONOR";

        boolean alreadyExists =
                notificationRepository.existsByUserIdAndFoodIdAndType(
                        donorId,
                        food.getId(),
                        type
                );

        if (alreadyExists) {
            return;
        }

        String pickupTime = formatPickupTime(food.getPickupTime());

        Notification notification = new Notification(
                donorId,
                food.getId(),
                type,
                "Pickup Reminder",
                "The pickup for " + food.getFoodItem()
                        + " is coming up at " + pickupTime + "."
        );

        notificationRepository.save(notification);
        if (fcmPushService != null) {
            fcmPushService.sendToUser(donorId, notification.getTitle(), notification.getMessage());
        }
    }

    private String formatPickupTime(LocalDateTime pickupTime) {

        DateTimeFormatter formatter =
                DateTimeFormatter.ofPattern("h:mm a");

        return pickupTime.format(formatter);
    }
}