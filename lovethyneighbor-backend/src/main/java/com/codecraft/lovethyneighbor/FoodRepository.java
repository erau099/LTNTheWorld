package com.codecraft.lovethyneighbor;

import jakarta.persistence.LockModeType;
import org.springframework.aop.support.AopUtils;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FoodRepository extends JpaRepository<Food, Long> {

    // Pessimistic row lock for concurrent claim/confirm/decline/complete/delete mutations
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Food f WHERE f.id = :id")
    Optional<Food> findByIdForUpdate(@Param("id") Long id);

    // Uses SELECT ... FOR UPDATE on real Spring Data JPA repositories while preserving Mockito unit test stubs
    static Optional<Food> findByIdForMutation(FoodRepository repository, Long id) {
        if (AopUtils.isAopProxy(repository)) {
            return repository.findByIdForUpdate(id);
        }
        return repository.findById(id);
    }

    // Retrieve food listings by user UUID (donor)
    List<Food> findByUserId(UUID userId);

    // Retrieve listings for a donor using their UUID, sorted by creation date
    List<Food> findByUser_IdOrderByCreatedAtDesc(UUID userUuid);

    // Retrieve food listings by availability status
    List<Food> findByStatusIgnoreCase(String status);

    // DT-87: listings in a status whose pickup window ended before the given time
    List<Food> findByStatusIgnoreCaseAndPickupEndTimeBefore(String status, LocalDateTime time);

    // Count food listings by availability status
    long countByStatusIgnoreCase(String status);

    // --- Add these methods for claimed orders ---
    List<Food> findByClaimedByUserId(UUID claimedByUserId);

    List<Food> findByClaimedByUserIdOrderByCreatedAtDesc(UUID claimedByUserId);

    // Bounded query for PickupReminderService so scheduled checks never scan historical listings/photos
    List<Food> findByClaimedByUserIdIsNotNullAndPickupTimeBetween(LocalDateTime start, LocalDateTime end);
}