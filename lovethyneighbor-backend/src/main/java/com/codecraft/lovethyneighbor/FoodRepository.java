
package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FoodRepository extends JpaRepository<Food, Long> {

    // Retrieve food listings by numeric user ID
    List<Food> findByUserId(Long userId);

    // Retrieve food listings by availability status
    List<Food> findByStatusIgnoreCase(String status);

    // Count listings by availability status
    long countByStatusIgnoreCase(String status);
}