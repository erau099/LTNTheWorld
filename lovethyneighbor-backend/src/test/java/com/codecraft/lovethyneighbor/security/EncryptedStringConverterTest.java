package com.codecraft.lovethyneighbor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.security.SecureRandom;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class EncryptedStringConverterTest {

    private EncryptedStringConverter converter;

    @BeforeEach
    void setUp() {
        // AES-256 requires a 32-byte (256-bit) key
        byte[] keyBytes = new byte[32];
        new SecureRandom().nextBytes(keyBytes);
        String base64Key = Base64.getEncoder().encodeToString(keyBytes);

        converter = new EncryptedStringConverter(base64Key);
    }

    @Test
    @DisplayName("Round-trip: Encrypting and decrypting should return original plain text")
    void testEncryptionRoundTrip() {
        String originalPhone = "555-123-4567";

        String encrypted = converter.convertToDatabaseColumn(originalPhone);

        assertNotNull(encrypted);
        assertNotEquals(originalPhone, encrypted);

        String decrypted = converter.convertToEntityAttribute(encrypted);
        assertEquals(originalPhone, decrypted);
    }

    @Test
    @DisplayName("Unique IV: Same input encrypted twice should produce different ciphertexts")
    void testUniqueInitializationVectors() {
        String phone = "555-000-1111";

        String encrypted1 = converter.convertToDatabaseColumn(phone);
        String encrypted2 = converter.convertToDatabaseColumn(phone);

        assertNotEquals(encrypted1, encrypted2, "Each encryption must use a unique random IV");
        assertEquals(phone, converter.convertToEntityAttribute(encrypted1));
        assertEquals(phone, converter.convertToEntityAttribute(encrypted2));
    }

    @Test
    @DisplayName("Null handling: Null values should remain null in both directions")
    void testNullHandling() {
        assertNull(converter.convertToDatabaseColumn(null));
        assertNull(converter.convertToEntityAttribute(null));
    }

    @Test
    @DisplayName("Tamper fallback: Decryption error falls back to returning the raw database value")
    void testTamperedCiphertextFallback() {
        String encrypted = converter.convertToDatabaseColumn("SensitiveData");
        
        // Corrupt the base64 string
        String tampered = "Corrupted" + encrypted.substring(9);

        // converter returns dbValue when decryption fails
        String fallback = converter.convertToEntityAttribute(tampered);
        assertEquals(tampered, fallback);
    }

    @Test
    @DisplayName("Missing key constructor should throw IllegalStateException")
    void testMissingKeyThrowsException() {
        assertThrows(IllegalStateException.class, () -> new EncryptedStringConverter(null));
        assertThrows(IllegalStateException.class, () -> new EncryptedStringConverter("   "));
    }
}