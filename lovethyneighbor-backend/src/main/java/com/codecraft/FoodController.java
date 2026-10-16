package com.codecraft;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import com.codecraft.lovethyneighbor.*;


@RestController 
@RequestMapping ("/api/food")
@CrossOrigin(origins = "http://localhost:5173")
public class FoodController {

    @Autowired
    private FoodRepository foodRepository;
    private UserRepository userRepository;

    public FoodController(FoodRepository foodRepository, UserRepository userRepository) {
        this.foodRepository = foodRepository;
        this.userRepository = userRepository;
    }


    @PostMapping
    public ResponseEntity<?> createFoodListing(@RequestBody Food food) {
        
        User user = userRepository.findById(food.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (food.getDate() == null ||
            food.getPickupTime() == null ||
            food.getFoodItem() == null ||
            food.getFoodItem().trim().isEmpty() ||
            food.getUserId() == null) {

            return ResponseEntity.badRequest()
                    .body("Missing required food listing information.");
        }
        Food foodListing = new Food();
        foodListing.setDate(food.getDate());
        foodListing.setPickupTime(food.getPickupTime());
        foodListing.setFoodItem(food.getFoodItem());
        foodListing.setDescription(food.getDescription());
        foodListing.setTags(food.getTags());
        foodListing.setAllergens(food.getAllergens());
        foodListing.setUserId(user.getId());
        

        Food savedFood = foodRepository.save(food);
        return ResponseEntity.ok(savedFood);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFoodById(@PathVariable Long id) {
        return foodRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/logins/{user_id1}")
    public ResponseEntity<?> getFoodByUserId(@PathVariable java.util.UUID user_id1) {
        Optional<User> userOptional = userRepository.findById(user_id1);
        if (!userOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOptional.get();
        return ResponseEntity.ok(foodRepository.findByUserId(user.getId()));
    }


}