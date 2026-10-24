package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FoodOrderRepository extends JpaRepository<FoodOrder, Long> {

    //Retrieve all orders belonging to a recipient
    List<FoodOrder> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    //Check if a recipient has already requested this food
    boolean existsByFoodIdAndRecipientId(Long foodId, UUID recipientId);

}