package com.codecraft.lovethyneighbor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class EncryptedLocalDateConverterTest {

    private EncryptedLocalDateConverter converter;

    @BeforeEach
    void setUp() {
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        String base64Key = Base64.getEncoder().encodeToString(keyBytes);

        converter = new EncryptedLocalDateConverter(base64Key);
    }

    @Test
    @DisplayName("Round-trip: Encrypting and decrypting LocalDate should preserve exact date")
    void testLocalDateRoundTrip() {
        LocalDate birthDate = LocalDate.of(1995, 6, 23);

        String encrypted = converter.convertToDatabaseColumn(birthDate);

        assertNotNull(encrypted);
        LocalDate decrypted = converter.convertToEntityAttribute(encrypted);

        assertEquals(birthDate, decrypted);
    }

    @Test
    @DisplayName("Null handling: Null dates should return null")
    void testNullHandling() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    @DisplayName("Fallback parsing: Should parse unencrypted ISO string if decryption fails")
    void testFallbackParsingPlainIsoString() {
        // Simulates pre-existing unencrypted date string in the database
        String plainIsoDate = "1990-12-05";

        LocalDate parsed = converter.convertToEntityAttribute(plainIsoDate);

        assertNotNull(parsed);
        assertEquals(LocalDate.of(1990, 12, 5), parsed);
    }
}