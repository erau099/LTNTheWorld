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
    private final ReviewRepository reviewRepository;
    private final FoodClaimService foodClaimService;
    private final GeocodingService geocodingService;

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    public FoodController(FoodRepository foodRepository, NotificationRepository notificationRepository,
            ReviewRepository reviewRepository, FoodClaimService foodClaimService) {
        this(foodRepository, notificationRepository, reviewRepository, foodClaimService, address -> Optional.empty());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public FoodController(FoodRepository foodRepository, NotificationRepository notificationRepository,
            ReviewRepository reviewRepository, FoodClaimService foodClaimService,
            GeocodingService geocodingService) {
        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
        this.foodClaimService = foodClaimService;
        this.geocodingService = geocodingService;
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

        // Geocode coordinates upon saving (Story 325)
        geocodingService.geocode(food.getAddress()).ifPresent(coords -> {
            food.setLatitude(coords.latitude());
            food.setLongitude(coords.longitude());
        });

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    // Recipient Dashboard: retrieve active listings with optional distance filtering (Story 327)
    @GetMapping
    public ResponseEntity<List<Food>> getAllActiveFood(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusMiles) {

        List<Food> foods = foodRepository.findByStatusIgnoreCase("ACTIVE");

        if (lat != null && lng != null) {
            foods = foods.stream()
                    .peek(f -> {
                        if (f.getLatitude() != null && f.getLongitude() != null) {
                            double dist = DistanceUtils.calculateDistanceMiles(lat, lng, f.getLatitude(), f.getLongitude());
                            f.setDistanceMiles(dist);
                            f.setFormattedDistance(DistanceUtils.formatDistance(dist));
                        }
                    })
                    .filter(f -> radiusMiles == null || (f.getDistanceMiles() != null && f.getDistanceMiles() <= radiusMiles))
                    .sorted((f1, f2) -> {
                        if (f1.getDistanceMiles() == null && f2.getDistanceMiles() == null) return 0;
                        if (f1.getDistanceMiles() == null) return 1;
                        if (f2.getDistanceMiles() == null) return -1;
                        return Double.compare(f1.getDistanceMiles(), f2.getDistanceMiles());
                    })
                    .toList();
        }

        // Story 108 Sub-task 3 & Story 326 Privacy Safeguard:
        // Mask exact street address in public recipient dashboard browsing
        for (Food f : foods) {
            String approx = extractApproximateLocation(f.getAddress());
            f.setApproximateLocation(approx);
            f.setAddress(approx);
        }

        return ResponseEntity.ok(foods);
    }

    private static String extractApproximateLocation(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            return "Sacramento Area";
        }
        String[] parts = fullAddress.split(",");
        if (parts.length >= 2) {
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i < parts.length; i++) {
                if (sb.length() > 0) sb.append(", ");
                sb.append(parts[i].trim());
            }
            return sb.toString();
        }
        return fullAddress.trim();
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
        updateExpiredFoodListings(foods);

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
            ).withListingDetails(food.getPickupEndTime(), food.getTags(), food.getPhotos());
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

        // Shared with POST /api/orders/{foodId}: creates the order and applies the cooldown (DT-51)
        try {
            return ResponseEntity.ok(foodClaimService.claim(id, recipientId).food());
        } catch (FoodClaimService.ClaimException e) {
            return ResponseEntity.status(e.getStatus()).body(e.getMessage());
        }
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
        foodClaimService.updateOrderStatus(food, "scheduled");

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
        food.setCompletedAt(LocalDateTime.now());
        Food updated = foodRepository.save(food);
        foodClaimService.updateOrderStatus(food, "completed");

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

    // Dev/Test helper: seed placeholder listings across various distances
    @PostMapping("/seed-test-data")
    @Transactional
    public ResponseEntity<?> seedDistanceTestData(Authentication authentication) {
        UUID donorId = null;
        if (authentication != null && authentication.getName() != null) {
            try {
                donorId = UUID.fromString(authentication.getName());
            } catch (Exception ignored) {}
        }
        if (donorId == null) {
            List<User> users = entityManager.createQuery("SELECT u FROM User u", User.class)
                    .setMaxResults(1)
                    .getResultList();
            if (users.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("No registered users exist in the database. Please create an account first.");
            }
            donorId = users.get(0).getId();
        }

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDateTime pickupStart = tomorrow.atTime(12, 0);
        LocalDateTime pickupEnd = tomorrow.atTime(15, 0);

        List<Food> testItems = List.of(
            createSeedItem(donorId, "Fresh Box Lunches (CSUS)", "Healthy deli box lunches and fruit", "Fresh / Hot", "Wheat", "6000 J St, Sacramento, CA 95819", 38.5595, -121.4230, tomorrow, pickupStart, pickupEnd),
            createSeedItem(donorId, "Artisan Sourdough Loaves (McKinley)", "Fresh baked organic sourdough loaves", "Fresh / Hot", "Wheat", "601 Alhambra Blvd, Sacramento, CA 95816", 38.5772, -121.4645, tomorrow, pickupStart, pickupEnd),
            createSeedItem(donorId, "Assorted Gourmet Bagels (Downtown)", "Assorted bagels with cream cheese spreads", "Fresh / Hot", "Wheat, Milk", "500 David J Stern Walk, Sacramento, CA 95814", 38.5802, -121.4997, tomorrow, pickupStart, pickupEnd),
            createSeedItem(donorId, "Organic Canned Soups & Beans (Arden)", "Canned lentil soup, black beans, and chickpeas", "Canned", "", "2405 Butano Dr, Sacramento, CA 95821", 38.6042, -121.3653, tomorrow.plusDays(1), pickupStart, pickupEnd),
            createSeedItem(donorId, "Farm Fresh Produce Crate (Elk Grove)", "Greens, zucchini, carrots, and apples", "Fresh / Hot", "", "8450 Laguna Blvd, Elk Grove, CA 95758", 38.4235, -121.4225, tomorrow, pickupStart, pickupEnd),
            createSeedItem(donorId, "Fruit & Pastries (UC Davis)", "Croissants, apples, oranges, and bananas", "Fresh / Hot", "Wheat, Eggs", "1 Shields Ave, Davis, CA 95616", 38.5419, -121.7486, tomorrow, pickupStart, pickupEnd),
            createSeedItem(donorId, "Canned Sweet Corn & Tuna (Roseville)", "Sweet corn, green beans, and tuna cans", "Canned", "Fish", "1151 Galleria Blvd, Roseville, CA 95678", 38.7708, -121.2687, tomorrow.plusDays(1), pickupStart, pickupEnd),
            createSeedItem(donorId, "Artisan Cheeses (San Francisco)", "Specialty cheeses and artisanal crackers", "Fresh / Hot", "Milk, Wheat", "1 Ferry Building, San Francisco, CA 94111", 37.7955, -122.3937, tomorrow, pickupStart, pickupEnd)
        );

        foodRepository.saveAll(testItems);
        return ResponseEntity.ok(java.util.Map.of(
            "message", "Successfully seeded " + testItems.size() + " test listings with geographic coordinates.",
            "count", testItems.size()
        ));
    }

    private Food createSeedItem(UUID donorId, String name, String desc, String tag, String allergen, String addr, double lat, double lng, LocalDate date, LocalDateTime start, LocalDateTime end) {
        Food f = new Food();
        f.setUserId(donorId);
        f.setFoodItem(name);
        f.setDescription(desc);
        f.setTags(tag);
        f.setAllergens(allergen);
        f.setAddress(addr);
        f.setLatitude(lat);
        f.setLongitude(lng);
        f.setDate(date);
        f.setPickupTime(start);
        f.setPickupEndTime(end);
        f.setStatus("ACTIVE");
        return f;
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
