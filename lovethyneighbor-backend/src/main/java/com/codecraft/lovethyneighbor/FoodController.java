
package com.codecraft.lovethyneighbor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {

    private final FoodRepository foodRepository;
    private final UserRepository userRepository;

    public FoodController(FoodRepository foodRepository,
                          UserRepository userRepository) {
        this.foodRepository = foodRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> createFoodListing(
            @RequestBody CreateFoodRequest request) {

        if (request.food == null ||
            request.userUuid == null ||
            request.food.getDate() == null ||
            request.food.getPickupTime() == null ||
            request.food.getFoodItem() == null ||
            request.food.getFoodItem().trim().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Missing required food listing information.");
        }

        Food food = request.food;

        User user = userRepository.findById(request.userUuid)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body("User not found.");
        }

        Food foodListing = new Food();
        foodListing.setDate(food.getDate());
        foodListing.setPickupTime(food.getPickupTime());
        foodListing.setFoodItem(food.getFoodItem());
        foodListing.setDescription(food.getDescription());
        foodListing.setTags(food.getTags());
        foodListing.setAllergens(food.getAllergens());

        // Preserve the existing numeric ID when provided
        foodListing.setUserId(food.getUserId());

        // Associate the listing with the UUID-based user
        foodListing.setUser(user);

        foodListing.setStatus(
            food.getStatus() == null ||
            food.getStatus().trim().isEmpty()
                ? "ACTIVE"
                : food.getStatus()
        );

        Food savedFood = foodRepository.save(foodListing);
        return ResponseEntity.ok(savedFood);
    }

    @GetMapping
    public ResponseEntity<List<Food>> getAllActiveFood() {
        return ResponseEntity.ok(
            foodRepository.findByStatusIgnoreCase("ACTIVE")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                    ResponseEntity.notFound().build()
                );
    }

    public static class CreateFoodRequest {
        public Food food;
        public UUID userUuid;
    }
}
