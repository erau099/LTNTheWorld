package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController 
@RequestMapping("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {

    @Autowired
    private FoodRepository foodRepository;

    @PostMapping
    public ResponseEntity<?> createFoodListing(@RequestBody Food food) {

        if (food.getDate() == null ||
            food.getPickupTime() == null ||
            food.getFoodItem() == null ||
            food.getFoodItem().trim().isEmpty() ||
            food.getUserId() == null) {

            return ResponseEntity.badRequest()
                    .body("Missing required food listing information.");
        }

        if (food.getStatus() == null || food.getStatus().trim().isEmpty()) {
            food.setStatus("ACTIVE");
        }

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    @GetMapping
    public ResponseEntity<List<Food>> getAllActiveFood() {
        return ResponseEntity.ok(foodRepository.findByStatusIgnoreCase("ACTIVE"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
