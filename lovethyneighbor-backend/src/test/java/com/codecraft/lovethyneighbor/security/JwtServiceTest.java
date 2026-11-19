package com.codecraft.lovethyneighbor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private String base64Secret;

    @BeforeEach
    void setUp() {
        // Generate a cryptographically secure 256-bit key for HMAC-SHA256 testing
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        base64Secret = Base64.getEncoder().encodeToString(keyBytes);

        jwtService = new JwtService(base64Secret);
    }

    @Test
    @DisplayName("Should generate token and parse expected claims")
    void shouldGenerateAndParseToken() {
        UUID userId = UUID.randomUUID();
        String role = "donor";

        String token = jwtService.generateToken(userId, role);

        assertNotNull(token);
        assertFalse(token.isBlank());

        Claims claims = jwtService.parseToken(token);
        assertEquals(userId.toString(), claims.getSubject());
        assertEquals("donor", claims.get("role", String.class));
        assertNotNull(claims.getExpiration());
        assertNotNull(claims.getIssuedAt());
    }

    @Test
    @DisplayName("Should fail parsing when token signature is tampered with")
    void shouldFailWhenSignatureIsTampered() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateToken(userId, "recipient");

        // Tamper with the signature portion of the compact JWT
        String[] parts = token.split("\\.");
        String tamperedSignature = parts[2].substring(0, parts[2].length() - 4) + "XXXX";
        String tamperedToken = parts[0] + "." + parts[1] + "." + tamperedSignature;

        assertThrows(Exception.class, () -> jwtService.parseToken(tamperedToken));
    }

    @Test
    @DisplayName("Should fail parsing when signed with a different key")
    void shouldFailWhenSignedWithDifferentKey() {
        byte[] otherKeyBytes = new byte[32];
        new SecureRandom().nextBytes(otherKeyBytes);
        JwtService otherJwtService = new JwtService(Base64.getEncoder().encodeToString(otherKeyBytes));

        String tokenFromOther = otherJwtService.generateToken(UUID.randomUUID(), "both");

        assertThrows(SignatureException.class, () -> jwtService.parseToken(tokenFromOther));
    }
}

