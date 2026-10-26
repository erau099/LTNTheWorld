package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FoodRepository extends JpaRepository<Food, Long> {

    // Retrieve food listings by user UUID (donor)
    List<Food> findByUserId(UUID userId);

    // Retrieve listings for a donor using their UUID, sorted by creation date
    List<Food> findByUser_IdOrderByCreatedAtDesc(UUID userUuid);

    // Retrieve food listings by availability status
    List<Food> findByStatusIgnoreCase(String status);

    // Count food listings by availability status
    long countByStatusIgnoreCase(String status);

    // --- Add these methods for claimed orders ---
    List<Food> findByClaimedByUserId(UUID claimedByUserId);

    List<Food> findByClaimedByUserIdOrderByCreatedAtDesc(UUID claimedByUserId);
}