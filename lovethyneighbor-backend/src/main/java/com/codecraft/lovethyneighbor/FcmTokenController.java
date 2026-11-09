package com.codecraft.lovethyneighbor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications/tokens")
public class FcmTokenController {
    private final FcmTokenRepository tokenRepository;

    public FcmTokenController(FcmTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    public record TokenRequest(String token) {}

    private UUID currentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        try { return UUID.fromString(authentication.getName()); }
        catch (IllegalArgumentException ex) { return null; }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> register(@RequestBody TokenRequest request, Authentication authentication) {
        UUID userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (request == null || request.token() == null || request.token().isBlank() || request.token().length() > 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid FCM token"));

        String token = request.token().trim();
        FcmToken existing = tokenRepository.findById(token).orElse(null);
        if (existing == null) tokenRepository.save(new FcmToken(token, userId));
        else {
            existing.setUserId(userId);
            existing.setUpdatedAt(LocalDateTime.now());
            tokenRepository.save(existing);
        }
        return ResponseEntity.ok(Map.of("registered", true));
    }

    @GetMapping
    public ResponseEntity<?> status(@RequestParam String token, Authentication authentication) {
        UUID userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (token == null || token.isBlank() || token.length() > 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid FCM token"));
        boolean registered = tokenRepository.findById(token.trim())
            .map(existing -> userId.equals(existing.getUserId()))
            .orElse(false);
        return ResponseEntity.ok(Map.of("registered", registered));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> unregister(@RequestBody TokenRequest request, Authentication authentication) {
        UUID userId = currentUserId(authentication);
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (request == null || request.token() == null || request.token().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Token is required"));

        tokenRepository.findById(request.token().trim()).ifPresent(existing -> {
            if (userId.equals(existing.getUserId())) tokenRepository.delete(existing);
        });
        return ResponseEntity.noContent().build();
    }
}
