package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FoodRepository extends JpaRepository<Food, Long> {
<<<<<<< HEAD
    List<Food> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Food> findByStatusIgnoreCase(String status);
=======

    // Retrieve food listings by user UUID
    List<Food> findByUserId(UUID userId);

    // Retrieve listings for a donor using their UUID,
    // sorted by creation date (newest first)
    List<Food> findByUser_IdOrderByCreatedAtDesc(UUID userUuid);

    // Retrieve food listings by availability status
    List<Food> findByStatusIgnoreCase(String status);

    // Count food listings by availability status
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
    long countByStatusIgnoreCase(String status);
}
