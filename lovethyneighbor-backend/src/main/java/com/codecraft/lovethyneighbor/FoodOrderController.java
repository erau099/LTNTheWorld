package com.codecraft.lovethyneighbor;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class FoodOrderController {

    private final FoodOrderRepository foodOrderRepository;
    private final FoodRepository foodRepository;

    public FoodOrderController(
            FoodOrderRepository foodOrderRepository,
            FoodRepository foodRepository) {

        this.foodOrderRepository = foodOrderRepository;
        this.foodRepository = foodRepository;
    }

    // Recipient Past Orders: retrieve the logged-in user's orders
    @GetMapping("/mine")
    public ResponseEntity<?> getMyOrders(Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401).body("You must be logged in.");
        }

        UUID recipientId;

        try {
            recipientId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body("Invalid user ID.");
        }

        List<FoodOrder> orders = 
            foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        return ResponseEntity.ok(orders);
    }

    // Recipient Dashboard: request a food listing
    @PostMapping("/{foodId}")
    @Transactional
    public ResponseEntity<?> createOrder(
            @PathVariable Long foodId,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(401)
                    .body("You must be logged in.");
        }

        UUID recipientId;

        try {
            recipientId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body("Invalid user ID.");
        }

        // Find the food listing
        var optionalFood = foodRepository.findById(foodId);

        if (optionalFood.isEmpty()) {
            return ResponseEntity.status(404)
                    .body("Food listing not found.");
        }

        Food food = optionalFood.get();

        // Only available food can be requested
        if (!"ACTIVE".equalsIgnoreCase(food.getStatus())) {
            return ResponseEntity.badRequest()
                    .body("This food is no longer available.");
        }

        // Prevent donors from requesting their own food
        if (recipientId.equals(food.getUserId())) {
            return ResponseEntity.badRequest()
                    .body("You cannot request your own listing.");
        }

        // Prevent duplicate requests
        if (foodOrderRepository.existsByFoodIdAndRecipientId(
                foodId, recipientId)) {

            return ResponseEntity.badRequest()
                    .body("You already requested this food.");
        }

        // Create the order
        FoodOrder order = new FoodOrder();

        order.setFoodId(foodId);
        order.setRecipientId(recipientId);
        order.setStatus("pending");

        FoodOrder savedOrder = foodOrderRepository.save(order);

        return ResponseEntity.ok(savedOrder);
    }
}