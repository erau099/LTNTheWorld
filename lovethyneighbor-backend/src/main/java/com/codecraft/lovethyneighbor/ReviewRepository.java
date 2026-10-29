
package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    // foodId is Long (bigint)
    List<Review> findByFoodId(Long foodId);

    // userId is UUID
    List<Review> findByUserId(UUID userId);

    // DT-50: Retrieve negative reviews for administrator review.
    List<Review> findByRatingLessThanEqualOrderByCreatedAtDesc(int rating);
}
