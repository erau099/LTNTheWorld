package com.codecraft.lovethyneighbor.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Base64;

// Same AES-256-GCM approach as EncryptedStringConverter, but converts
// LocalDate <-> String before/after doing the actual encryption.
@Converter
public class EncryptedLocalDateConverter implements AttributeConverter<LocalDate, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKeySpec key;

    public EncryptedLocalDateConverter(@Value("${ENCRYPTION_KEY}") String base64Key) {
        if (base64Key == null || base64Key.isBlank()) {
            throw new IllegalStateException("ENCRYPTION_KEY environment variable is not set");
        }
        byte[] decodedKey = Base64.getDecoder().decode(base64Key);
        this.key = new SecretKeySpec(decodedKey, "AES");
    }

    @Override
    public String convertToDatabaseColumn(LocalDate dateValue) {
        if (dateValue == null) {
            return null;
        }
        try {
            // LocalDate -> "2001-04-15" style string, then encrypt that string
            String plainValue = dateValue.toString();

            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            byte[] ciphertext = cipher.doFinal(plainValue.getBytes(StandardCharsets.UTF_8));

            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);

            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    @Override
    public LocalDate convertToEntityAttribute(String dbValue) {
        if (dbValue == null) {
            return null;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(dbValue);

            ByteBuffer buffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[IV_LENGTH_BYTES];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, iv));

            byte[] plaintext = cipher.doFinal(ciphertext);
            String plainValue = new String(plaintext, StandardCharsets.UTF_8);

            // "2001-04-15" string -> back into a LocalDate
            return LocalDate.parse(plainValue);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}