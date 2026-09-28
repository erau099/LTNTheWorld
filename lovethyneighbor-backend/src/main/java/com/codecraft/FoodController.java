package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {
    @Autowired private FoodRepository foodRepository;

    @PostMapping
    public ResponseEntity<Food> createFoodListing(@RequestBody Food food) {
        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }
}