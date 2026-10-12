package com.codecraft.lovethyneighbor;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByFoodId(Long foodId);
    List<Review> findByUserId(UUID userId);
}