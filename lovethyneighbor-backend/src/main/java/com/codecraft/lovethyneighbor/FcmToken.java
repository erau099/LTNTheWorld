package com.codecraft.lovethyneighbor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fcm_tokens", indexes = @Index(name = "idx_fcm_tokens_user_id", columnList = "user_id"))
public class FcmToken {
    @Id
    @Column(name = "token", nullable = false, length = 1024)
    private String token;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected FcmToken() {}

    public FcmToken(String token, UUID userId) {
        this.token = token;
        this.userId = userId;
        this.updatedAt = LocalDateTime.now();
    }

    public String getToken() { return token; }
    public UUID getUserId() { return userId; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
