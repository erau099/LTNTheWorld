package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Food> findByStatusIgnoreCase(String status);
    long countByStatusIgnoreCase(String status);
}
