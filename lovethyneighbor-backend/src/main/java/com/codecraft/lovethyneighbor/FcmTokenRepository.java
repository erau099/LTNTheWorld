package com.codecraft.lovethyneighbor;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FcmTokenRepository extends JpaRepository<FcmToken, String> {
    List<FcmToken> findByUserId(UUID userId);
    long deleteByUserId(UUID userId);
}
