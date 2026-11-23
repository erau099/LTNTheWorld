package com.codecraft.lovethyneighbor;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushNotification;
import com.google.firebase.messaging.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Service
public class FcmPushService {

    private static final Logger log = LoggerFactory.getLogger(FcmPushService.class);

    private final FcmTokenRepository tokenRepository;
    private final String serviceAccountJson;
    private final String credentialsPath;
    private volatile boolean initialized = false;

    public FcmPushService(
            FcmTokenRepository tokenRepository,
            @Value("${app.firebase.service-account-json:}") String serviceAccountJson,
            @Value("${app.firebase.credentials-path:}") String credentialsPath
    ) {
        this.tokenRepository = tokenRepository;
        this.serviceAccountJson = serviceAccountJson;
        this.credentialsPath = credentialsPath;
    }

    @PostConstruct
    void initFirebase() {
        if ((serviceAccountJson == null || serviceAccountJson.isBlank())
                && (credentialsPath == null || credentialsPath.isBlank())) {
            log.info("Firebase Admin credentials not configured; server-side FCM push dispatch is disabled.");
            return;
        }

        try {
            if (!FirebaseApp.getApps().isEmpty()) {
                initialized = true;
                return;
            }
            try (InputStream stream = openCredentialsStream()) {
                if (stream == null) return;
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();
                FirebaseApp.initializeApp(options);
                initialized = true;
                log.info("Firebase Admin SDK initialized for server-side FCM push notifications.");
            }
        } catch (Exception ex) {
            log.warn("Failed to initialize Firebase Admin SDK; push dispatch disabled: {}", ex.getMessage());
        }
    }

    private InputStream openCredentialsStream() throws Exception {
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            return new ByteArrayInputStream(serviceAccountJson.getBytes(StandardCharsets.UTF_8));
        }
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            return new FileInputStream(credentialsPath.trim());
        }
        return null;
    }

    public boolean isEnabled() {
        return initialized;
    }

    public void sendToUser(UUID userId, String title, String body) {
        if (!initialized || userId == null) {
            return;
        }
        List<FcmToken> tokens = tokenRepository.findByUserId(userId);
        if (tokens == null || tokens.isEmpty()) {
            return;
        }
        for (FcmToken entry : tokens) {
            sendSingle(entry, title, body);
        }
    }

    private void sendSingle(FcmToken entry, String title, String body) {
        try {
            Message msg = Message.builder()
                    .setToken(entry.getToken())
                    .setWebpushConfig(WebpushConfig.builder()
                            .setNotification(WebpushNotification.builder()
                                    .setTitle(title)
                                    .setBody(body)
                                    .setIcon("/favicon.svg")
                                    .build())
                            .build())
                    .putData("title", title != null ? title : "Love Thy Neighbor")
                    .putData("body", body != null ? body : "")
                    .build();

            FirebaseMessaging.getInstance().send(msg);
        } catch (FirebaseMessagingException ex) {
            MessagingErrorCode code = ex.getMessagingErrorCode();
            if (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT) {
                log.info("Removing stale/invalid FCM token for user {}", entry.getUserId());
                tokenRepository.delete(entry);
            } else {
                log.warn("FCM push send failed for user {}: {}", entry.getUserId(), ex.getMessage());
            }
        } catch (Exception ex) {
            log.warn("Unexpected FCM push failure for user {}: {}", entry.getUserId(), ex.getMessage());
        }
    }
}
