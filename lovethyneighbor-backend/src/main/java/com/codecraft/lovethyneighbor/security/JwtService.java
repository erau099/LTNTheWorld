package com.codecraft.lovethyneighbor.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    // Token lifetime: 30 minutes
    private static final long EXPIRATION_MILLIS = 30 * 60 * 1000;

    private final SecretKey signingKey;

    public JwtService(@Value("${JWT_SECRET}") String base64Secret) {
        byte[] decodedKey = Base64.getDecoder().decode(base64Secret);
        this.signingKey = Keys.hmacShaKeyFor(decodedKey);
    }

    // Called at login — builds a signed token containing just userId and role
    // Note: no PII
    public String generateToken(UUID userId, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRATION_MILLIS);

        return Jwts.builder()
                .subject(userId.toString())   // "sub" claim
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    // Verifies signature and expiration, then returns the claims (userId and role)
    // Throws an exception if the token is invalid or expired
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}