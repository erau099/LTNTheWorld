package com.codecraft.lovethyneighbor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.transaction.Transactional;

import java.time.LocalDate;
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
    private final ReviewRepository reviewRepository;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public FoodController(FoodRepository foodRepository, NotificationRepository notificationRepository, ReviewRepository reviewRepository) {
        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
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

        List<Food> foods = foodRepository.findByUser_IdOrderByCreatedAtDesc(userUuid);

        List<DonorListingResponse> responseList = foods.stream().map(food -> {
            String recipientName = "Unclaimed";
            UUID recipientId = food.getClaimedByUserId();

            if (recipientId != null) {
                User recipient = entityManager.find(User.class, recipientId);
                if (recipient != null) {
                    recipientName = recipient.getName();
                } else {
                    recipientName = "Recipient (" + recipientId.toString().substring(0, 8) + "...)";
                }
            }

            // Look up review for this food item (bigint PK)
            List<Review> reviews = reviewRepository.findByFoodId(food.getId());
            Integer rating = null;
            String comment = null;

            if (!reviews.isEmpty()) {
                Review rev = reviews.get(0);
                rating = rev.getRating();
                comment = rev.getComment();
            }

            return new DonorListingResponse(
                    food.getId(),
                    food.getFoodItem(),
                    food.getStatus(),
                    food.getDate(),
                    food.getPickupTime(),
                    recipientId,
                    recipientName,
                    rating,
                    comment
            );
        }).toList();

        return ResponseEntity.ok(responseList);
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

        // Only an existing pending recipient request can be approved. (DT-75)
        if (!"CLAIMED".equalsIgnoreCase(food.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Only a pending food request can be approved.");
        }
        if (food.getClaimedByUserId() == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This food listing has no requesting recipient.");
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

        // DT-75: notify the recipient who requested this listing.
        Notification recipientNotification = new Notification(
                food.getClaimedByUserId(),
                food.getId(),
                "REQUEST_APPROVED",
                "Request Approved: " + food.getFoodItem(),
                "Your request for '" + food.getFoodItem()
                        + "' has been approved by the donor. Please check your orders for pickup details."
        );
        notificationRepository.save(recipientNotification);

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

        // DT-74: notify only when a scheduled pickup actually becomes completed.
        if (!"SCHEDULED".equalsIgnoreCase(food.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Only a scheduled pickup can be marked as completed.");
        }
        if (food.getClaimedByUserId() == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This pickup has no requesting recipient.");
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

        // DT-74: the recipient also needs to know that pickup is complete.
        Notification recipientNotification = new Notification(
                food.getClaimedByUserId(),
                food.getId(),
                "PICKUP_COMPLETED",
                "Pickup Completed: " + food.getFoodItem(),
                "Your pickup for '" + food.getFoodItem()
                        + "' has been marked as completed. Thank you for helping reduce food waste!"
        );
        notificationRepository.save(recipientNotification);

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
