package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByUserId(Long userId);
    List<Food> findByStatusIgnoreCase(String status);
    long countByStatusIgnoreCase(String status);
}
