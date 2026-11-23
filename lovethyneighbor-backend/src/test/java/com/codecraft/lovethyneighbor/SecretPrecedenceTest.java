package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.EncryptedLocalDateConverter;
import com.codecraft.lovethyneighbor.security.EncryptedStringConverter;
import com.codecraft.lovethyneighbor.security.JwtService;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.Base64;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "ENCRYPTION_KEY=QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU=",
        "JWT_SECRET=OTg3NjU0MzIxMDk4NzY1NDMyMTA5ODc2NTQzMjEwOTg3NjU0MzIxMDk4NzY1NDMyMTA5ODc2NTQzMjEwOTg="
})
class SecretPrecedenceTest {

    private static final String DEFAULT_DEV_ENCRYPTION_KEY =
            "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=";
    private static final String DEFAULT_DEV_JWT_SECRET =
            "MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=";
    private static final String CUSTOM_ENCRYPTION_KEY =
            "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU=";
    private static final String CUSTOM_JWT_SECRET =
            "OTg3NjU0MzIxMDk4NzY1NDMyMTA5ODc2NTQzMjEwOTg3NjU0MzIxMDk4NzY1NDMyMTA5ODc2NTQzMjEwOTg=";

    @Autowired
    private JwtService jwtService;

    @Value("${app.security.encryption-key}")
    private String resolvedEncryptionKey;

    @Value("${app.security.jwt-secret}")
    private String resolvedJwtSecret;

    @Test
    @DisplayName("Overridden ENCRYPTION_KEY and JWT_SECRET take precedence over application.properties defaults")
    void overriddenSecretsTakePrecedenceOverDefaults() {
        assertEquals(CUSTOM_ENCRYPTION_KEY, resolvedEncryptionKey);
        assertEquals(CUSTOM_JWT_SECRET, resolvedJwtSecret);
        assertNotEquals(DEFAULT_DEV_ENCRYPTION_KEY, resolvedEncryptionKey);
        assertNotEquals(DEFAULT_DEV_JWT_SECRET, resolvedJwtSecret);
    }

    @Test
    @DisplayName("JwtService rejects tokens signed with fallback dev secret when custom JWT_SECRET is set")
    void jwtServiceRejectsFallbackSecretTokens() {
        UUID userId = UUID.randomUUID();
        String customToken = jwtService.generateToken(userId, "donor");
        assertEquals(userId.toString(), jwtService.parseToken(customToken).getSubject());

        JwtService fallbackJwtService = new JwtService(DEFAULT_DEV_JWT_SECRET);
        String fallbackToken = fallbackJwtService.generateToken(userId, "ADMIN");
        assertThrows(SignatureException.class, () -> jwtService.parseToken(fallbackToken));
    }

    @Test
    @DisplayName("Attribute converters encrypt with overridden ENCRYPTION_KEY rather than fallback dev key")
    void encryptionConvertersUseOverriddenKey() {
        EncryptedStringConverter customStringConverter = new EncryptedStringConverter(resolvedEncryptionKey);
        EncryptedStringConverter fallbackStringConverter = new EncryptedStringConverter(DEFAULT_DEV_ENCRYPTION_KEY);

        String cipherPhone = customStringConverter.convertToDatabaseColumn("555-867-5309");
        assertEquals("555-867-5309", customStringConverter.convertToEntityAttribute(cipherPhone));
        // Fallback key cannot decrypt ciphertext encrypted with overridden key (falls back to raw ciphertext)
        assertEquals(cipherPhone, fallbackStringConverter.convertToEntityAttribute(cipherPhone));
        assertNotEquals("555-867-5309", fallbackStringConverter.convertToEntityAttribute(cipherPhone));

        EncryptedLocalDateConverter customDateConverter = new EncryptedLocalDateConverter(resolvedEncryptionKey);
        EncryptedLocalDateConverter fallbackDateConverter = new EncryptedLocalDateConverter(DEFAULT_DEV_ENCRYPTION_KEY);

        LocalDate dob = LocalDate.of(1992, 8, 14);
        String cipherDob = customDateConverter.convertToDatabaseColumn(dob);
        assertEquals(dob, customDateConverter.convertToEntityAttribute(cipherDob));
        assertNull(fallbackDateConverter.convertToEntityAttribute(cipherDob));
        assertEquals(32, Base64.getDecoder().decode(resolvedEncryptionKey).length);
    }
}
