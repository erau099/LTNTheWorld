package com.codecraft.lovethyneighbor;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class FoodOrderController {

    private final FoodOrderRepository foodOrderRepository;
    private final FoodRepository foodRepository;
    private final NotificationRepository notificationRepository;
    private final FoodClaimService foodClaimService;

    public FoodOrderController(
            FoodOrderRepository foodOrderRepository,
            FoodRepository foodRepository,
            NotificationRepository notificationRepository,
            FoodClaimService foodClaimService) {

        this.foodOrderRepository = foodOrderRepository;
        this.foodRepository = foodRepository;
        this.notificationRepository = notificationRepository;
        this.foodClaimService = foodClaimService;
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

        try {
            return ResponseEntity.ok(foodClaimService.claim(foodId, recipientId).order());
        } catch (FoodClaimService.ClaimException e) {
            return ResponseEntity.status(e.getStatus()).body(e.getMessage());
        }
    }

    // DT-51: tells the recipient dashboard whether they can request food right now
    @GetMapping("/cooldown")
    public ResponseEntity<?> getCooldown(Authentication authentication) {

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

        Map<String, Object> body = new HashMap<>();
        var nextAllowed = foodClaimService.nextClaimAllowedAt(recipientId);
        body.put("canRequest", nextAllowed.isEmpty());
        body.put("nextRequestAt", nextAllowed.orElse(null));
        body.put("cooldownHours", foodClaimService.getCooldown().toHours());
        return ResponseEntity.ok(body);
    }

    // Only the listing's donor can decline its pending request. (DT-76)
    @PatchMapping("/food/{id}/decline-request")
    @Transactional
    public ResponseEntity<?> declineRequest(@PathVariable Long id, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in.");
        }

        UUID donorId;
        try {
            donorId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException failure) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication identity.");
        }

        var optionalFood = foodRepository.findById(id);
        if (optionalFood.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food listing not found.");
        }

        Food food = optionalFood.get();
        if (!donorId.equals(food.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only the listing donor can decline this request.");
        }
        if (!"CLAIMED".equalsIgnoreCase(food.getStatus())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Only a pending food request can be declined.");
        }
        UUID recipientId = food.getClaimedByUserId();
        if (recipientId == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("This food listing has no requesting recipient.");
        }

        // Mark the recipient's order for this listing as cancelled in their history (DT-261)
        for (FoodOrder order : foodOrderRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)) {
            if (order.getFoodId() == id.longValue() && "pending".equalsIgnoreCase(order.getStatus())) {
                order.setStatus("cancelled");
                foodOrderRepository.save(order);
            }
        }

        // Save the original recipient above before clearing the claim.
        food.setClaimedByUserId(null);
        food.setStatus("ACTIVE");
        Food updated = foodRepository.save(food);

        Notification notification = new Notification(
                recipientId,
                food.getId(),
                "REQUEST_DECLINED",
                "Request Declined: " + food.getFoodItem(),
                "Your request for '" + food.getFoodItem()
                        + "' was declined by the donor. You can browse other available food listings."
        );
        notificationRepository.save(notification);

        return ResponseEntity.ok(updated);
    }
}
