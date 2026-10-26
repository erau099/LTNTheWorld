package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    // Find the saved address belonging to a specific user.
    Optional<Address> findByUserId(UUID userId);
}
