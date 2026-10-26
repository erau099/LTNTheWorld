package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class NotificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationController notificationController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        userId = UUID.randomUUID();
    }

    @Test
    void testGetMyNotifications() throws Exception {
        Notification notification = new Notification(userId, 101L, "REQUEST_RECEIVED", "New Request", "A user requested your food.");
        notification.setId(1L);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(notification));

        mockMvc.perform(get("/api/notifications")
                .principal(new TestingAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("New Request"))
                .andExpect(jsonPath("$[0].type").value("REQUEST_RECEIVED"));
    }

    @Test
    void testGetUnreadCount() throws Exception {
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(3L);

        mockMvc.perform(get("/api/notifications/unread-count")
                .principal(new TestingAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));
    }

    @Test
    void testMarkAsRead() throws Exception {
        Notification notification = new Notification(userId, 101L, "REQUEST_RECEIVED", "New Request", "A user requested your food.");
        notification.setId(1L);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(patch("/api/notifications/1/read")
                .principal(new TestingAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    void testMarkAllAsRead() throws Exception {
        Notification notification = new Notification(userId, 101L, "REQUEST_RECEIVED", "New Request", "A user requested your food.");
        notification.setId(1L);
        notification.setRead(false);

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(notification));

        mockMvc.perform(patch("/api/notifications/read-all")
                .principal(new TestingAuthenticationToken(userId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));
    }
}
