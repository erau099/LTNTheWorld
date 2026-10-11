package com.codecraft.lovethyneighbor.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    // AES in GCM mode with no padding is used for encryption and decryption
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    // Actual key
    private final SecretKeySpec key;

    // Fetch the key in .env file and decode it from Base64
    public EncryptedStringConverter(@Value("${ENCRYPTION_KEY}") String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("ENCRYPTION_KEY environment variable is not set");
        }
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        this.key = new SecretKeySpec(decodedKey, "AES");
    }

    @Override
    public String convertToDatabaseColumn(String plainValue) {
        if (plainValue == null) {
            return null;
        }
        try {
            // Generating a random IV for each encryption operation
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            // Encrypt the UTF-8 bytes of the plain text
            byte[] ciphertext = cipher.doFinal(plainValue.getBytes(StandardCharsets.UTF_8));

            // Store current IV to decrypt later
            // [IV][Ciphertext] format is used for storage
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            // Encode as base64 for storage in the database
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbValue) {
        if (dbValue == null) {
            return null;
        }
        try {
            // Reverse base64 encoding to get [IV][Ciphertext] format
            byte[] decoded = Base64.getDecoder().decode(dbValue);
            ByteBuffer buffer = ByteBuffer.wrap(decoded);

            // First 12 bytes are the IV, the rest is the ciphertext + auth tag (16 bytes for GCM)
            byte[] iv = new byte[IV_LENGTH_BYTES];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            // Check for tampering (will throw AEADBadTagException if tampered)
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}