package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping ("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {

    static final int MAX_PHOTOS = 3;
    // Roughly 2 MB of image data once base64-encoded
    static final int MAX_PHOTO_LENGTH = 2_800_000;

    @Autowired
    private FoodRepository foodRepository;

    // Posts a new food listing for the logged-in donor (role checked in SecurityConfig)
    @PostMapping
    public ResponseEntity<?> createFoodListing(@RequestBody FoodRequest request, Authentication authentication) {

        String error = validate(request);
        if (error != null) {
            return ResponseEntity.badRequest().body(error);
        }
        
        if (food.getStatus() == null || food.getStatus().trim().isEmpty()) {
        food.setStatus("ACTIVE");
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
        food.setPhotos(request.getPhotos() == null ? List.of() : request.getPhotos());

        // The JWT subject is the user's UUID, so the donor can't post as someone else
        food.setUserId(UUID.fromString(authentication.getName()));

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    // Listings posted by the logged-in donor, newest first
    @GetMapping("/mine")
    public List<Food> getMyListings(Authentication authentication) {
        return foodRepository.findByUserIdOrderByCreatedAtDesc(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Returns an error message for the first invalid field, or null if the request is valid
    static String validate(FoodRequest request) {
        if (isBlank(request.getFoodItem()) ||
            isBlank(request.getDescription()) ||
            isBlank(request.getAddress()) ||
            request.getTags() == null || request.getTags().isEmpty() ||
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
                return "You can upload up to " + MAX_PHOTOS + " photos.";
            }
            for (String photo : photos) {
                if (photo == null || !photo.startsWith("data:image/") || photo.length() > MAX_PHOTO_LENGTH) {
                    return "Each photo must be an image under 2 MB.";
                }
            }
        }

        return null;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    // Body of POST /api/food, filled in over the three upload pages
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
        public void setFoodItem(String foodItem) { this.foodItem = foodItem; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
        public List<String> getAllergens() { return allergens; }
        public void setAllergens(List<String> allergens) { this.allergens = allergens; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public LocalDate getDate() { return date; }
        public void setDate(LocalDate date) { this.date = date; }
        public LocalTime getStartTime() { return startTime; }
        public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
        public LocalTime getEndTime() { return endTime; }
        public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
        public List<String> getPhotos() { return photos; }
        public void setPhotos(List<String> photos) { this.photos = photos; }
    }
}
