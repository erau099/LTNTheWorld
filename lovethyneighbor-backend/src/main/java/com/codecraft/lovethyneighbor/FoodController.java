package com.codecraft.lovethyneighbor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {

    static final int MAX_PHOTOS = 3;
    static final int MAX_PHOTO_LENGTH = 2_800_000;

    private final FoodRepository foodRepository;
    private final NotificationRepository notificationRepository;

    public FoodController(FoodRepository foodRepository, NotificationRepository notificationRepository) {
        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
    }

    // Create a new food listing
    @PostMapping
    @Transactional
    public ResponseEntity<?> createFoodListing(
            @RequestBody FoodRequest request,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401)
                    .body("You must be logged in to post food.");
        }

        String error = validate(request);

        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }

        Food food = new Food();
        food.setFoodItem(request.getFoodItem().trim());
        food.setDescription(request.getDescription().trim());
        food.setTags(String.join(",", request.getTags()));
        food.setAllergens(request.getAllergens() == null ? "" : String.join(",", request.getAllergens()));
        food.setAddress(request.getAddress().trim());
        food.setDate(request.getDate());
        food.setPickupTime(request.getDate().atTime(request.getStartTime()));
        food.setPickupEndTime(request.getDate().atTime(request.getEndTime()));
        food.setPhotos(request.getPhotos() == null ? new ArrayList<>() : new ArrayList<>(request.getPhotos()));

        // The JWT subject is the user's UUID, so the donor can't post as someone else
        food.setUserId(UUID.fromString(authentication.getName()));

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    // Recipient Dashboard: retrieve active listings
    @GetMapping
    public ResponseEntity<List<Food>> getAllActiveFood() {
        return ResponseEntity.ok(
            foodRepository.findByStatusIgnoreCase("ACTIVE")
        );
    }

    // Donor Dashboard: retrieve own listings
    @GetMapping("/mine")
    public ResponseEntity<?> getMyListings(
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401)
                    .body("You must be logged in.");
        }

        UUID userUuid;

        try {
            userUuid = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body("Invalid authentication identity.");
        }
        List<Food> listings = foodRepository.findByUser_IdOrderByCreatedAtDesc(userUuid);
        updateExpiredFoodListings(listings);
        
        return ResponseEntity.ok(listings);
    }

    // Retrieve a specific food listing
    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                    ResponseEntity.notFound().build()
                );
    }

        // Donor Dashboard: set expired food listings to UNAVAILABLE once pickup end time has past
    private void updateExpiredFoodListings(List<Food> listings) {
        LocalDateTime now = LocalDateTime.now();

        for (Food food : listings) {
            if ("pending".equalsIgnoreCase(food.getStatus()) && food.getPickupEndTime() != null && !food.getPickupEndTime().isAfter(now)) {
                food.setStatus("UNAVAILABLE");
                foodRepository.save(food);
            }
        }
    }

    // DT-73 & DT-96: Recipient requests food listing, moving it to CLAIMED and notifying the donor
    @PostMapping("/{id}/request")
    @Transactional
    public ResponseEntity<?> requestFoodListing(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to request food.");
        }

        UUID recipientId;
        try {
            recipientId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication identity.");
        }

        Optional<Food> foodOpt = foodRepository.findById(id);
        if (foodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food listing not found.");
        }

        Food food = foodOpt.get();
        if (!"ACTIVE".equalsIgnoreCase(food.getStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("This food listing is no longer available.");
        }

        // Donor cannot claim their own listing
        if (food.getUserId() != null && food.getUserId().equals(recipientId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("You cannot request your own food listing.");
        }

        food.setStatus("CLAIMED");
        food.setClaimedByUserId(recipientId);
        Food updated = foodRepository.save(food);

        // Notify donor (DT-73)
        Notification notification = new Notification(
                food.getUserId(),
                food.getId(),
                "REQUEST_RECEIVED",
                "New Request for " + food.getFoodItem(),
                "A recipient has requested your listing '" + food.getFoodItem() + "'. Click to coordinate pickup."
        );
        notificationRepository.save(notification);

        return ResponseEntity.ok(updated);
    }

    // DT-78: Donor confirms pickup request and schedules it
    @PatchMapping("/{id}/confirm-pickup")
    @Transactional
    public ResponseEntity<?> confirmPickup(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in.");
        }

        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication identity.");
        }

        Optional<Food> foodOpt = foodRepository.findById(id);
        if (foodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food listing not found.");
        }

        Food food = foodOpt.get();
        if (food.getUserId() == null || !food.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the listing donor can confirm this pickup.");
        }

        food.setStatus("SCHEDULED");
        Food updated = foodRepository.save(food);

        // Notify donor (DT-78)
        Notification notification = new Notification(
                food.getUserId(),
                food.getId(),
                "PICKUP_SCHEDULED",
                "Pickup Scheduled: " + food.getFoodItem(),
                "Pickup for '" + food.getFoodItem() + "' has been confirmed and scheduled."
        );
        notificationRepository.save(notification);

        return ResponseEntity.ok(updated);
    }

    // DT-85: Mark pickup as completed
    @PatchMapping("/{id}/complete-pickup")
    @Transactional
    public ResponseEntity<?> completePickup(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in.");
        }

        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication identity.");
        }

        Optional<Food> foodOpt = foodRepository.findById(id);
        if (foodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food listing not found.");
        }

        Food food = foodOpt.get();
        boolean isDonor = food.getUserId() != null && food.getUserId().equals(userId);
        boolean isRecipient = food.getClaimedByUserId() != null && food.getClaimedByUserId().equals(userId);

        if (!isDonor && !isRecipient) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only the donor or recipient can mark this pickup as completed.");
        }

        food.setStatus("COMPLETED");
        Food updated = foodRepository.save(food);

        // Notify donor (DT-85)
        Notification notification = new Notification(
                food.getUserId(),
                food.getId(),
                "PICKUP_COMPLETED",
                "Pickup Completed: " + food.getFoodItem(),
                "'" + food.getFoodItem() + "' pickup has been completed. Thank you for your donation!"
        );
        notificationRepository.save(notification);

        return ResponseEntity.ok(updated);
    }

    // Validate food upload information
    static String validate(FoodRequest request) {

        if (request == null ||
            isBlank(request.getFoodItem()) ||
            isBlank(request.getDescription()) ||
            isBlank(request.getAddress()) ||
            request.getTags() == null ||
            request.getTags().isEmpty() ||
            request.getDate() == null ||
            request.getStartTime() == null ||
            request.getEndTime() == null) {

            return "Missing required food listing information.";
        }

        if (request.getDate().isBefore(LocalDate.now())) {
            return "Pickup date cannot be in the past.";
        }

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            return "Pickup end time must be after the start time.";
        }

        List<String> photos = request.getPhotos();

        if (photos != null) {
            if (photos.size() > MAX_PHOTOS) {
                return "You can upload up to " +
                        MAX_PHOTOS + " photos.";
            }

            for (String photo : photos) {
                if (photo == null ||
                    !photo.startsWith("data:image/") ||
                    photo.length() > MAX_PHOTO_LENGTH) {

                    return "Each photo must be an image under 2.8 MB.";
                }
            }
        }

        return null;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    // Request body from the three-step upload process
    public static class FoodRequest {

        private String foodItem;
        private String description;
        private List<String> tags;
        private List<String> allergens;
        private String address;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private List<String> photos;

        public String getFoodItem() { return foodItem; }
        public void setFoodItem(String foodItem) {
            this.foodItem = foodItem;
        }

        public String getDescription() { return description; }
        public void setDescription(String description) {
            this.description = description;
        }

        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) {
            this.tags = tags;
        }

        public List<String> getAllergens() { return allergens; }
        public void setAllergens(List<String> allergens) {
            this.allergens = allergens;
        }

        public String getAddress() { return address; }
        public void setAddress(String address) {
            this.address = address;
        }

        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) {
            this.date = date;
        }

        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) {
            this.startTime = startTime;
        }

        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) {
            this.endTime = endTime;
        }

        public List<String> getPhotos() { return photos; }
        public void setPhotos(List<String> photos) {
            this.photos = photos;
        }
    }
}
