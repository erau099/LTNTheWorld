package com.codecraft;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController 
@RequestMapping ("/api/food")
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

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}