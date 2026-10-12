package com.codecraft;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.codecraft.lovethyneighbor.*;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByUserId(Long userId);
}
