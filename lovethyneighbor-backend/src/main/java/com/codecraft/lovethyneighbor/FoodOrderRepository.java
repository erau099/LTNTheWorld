package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    //Retrieve all orders belonging to a recipient
    List<FoodOrder> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    //Check if a recipient has already requested this food
    boolean existsByFoodIdAndRecipientId(Long foodId, UUID recipientId);

    // Most recent request that wasn't cancelled, used for the pickup cooldown (DT-51)
    Optional<FoodOrder> findFirstByRecipientIdAndStatusNotIgnoreCaseOrderByCreatedAtDesc(UUID recipientId, String status);

    // A recipient's order(s) for one listing, used to keep order status in step with the pickup
    List<FoodOrder> findByFoodIdAndRecipientId(Long foodId, UUID recipientId);

}