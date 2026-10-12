package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminController adminController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }

    @Test
    void testAdminLoginWithDefaultCredentials() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin\",\"password\":\"1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void testAdminLoginWithNonAdminUserReturnsForbidden() throws Exception {
        User donorUser = new User("Jane", "Doe", "jane@example.com", "secret",
                LocalDate.of(1995, 1, 1), "1234567890", "donor");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(donorUser));

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"jane@example.com\",\"password\":\"secret\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied: Administrator privileges required"));
    }

    @Test
    void testAdminLoginWithInvalidCredentialsReturnsUnauthorized() throws Exception {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"unknown@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    @Test
    void testAdminLoginWithAdminRoleInDatabaseReturnsOk() throws Exception {
        User adminUser = new User("Admin", "Staff", "admin@domain.com", "pass123",
                LocalDate.of(1990, 5, 10), "5551234567", "ADMIN");
        when(userRepository.findByEmail("admin@domain.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(post("/api/admin/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"admin@domain.com\",\"password\":\"pass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void testGetAllUsersExcludesPasswordsAndReturnsUserSummaries() throws Exception {
        User user1 = new User("Alice", "Smith", "alice@example.com", "secretPassword123",
                LocalDate.of(1998, 2, 14), "1112223333", "donor");
        user1.setId(UUID.randomUUID());

        User user2 = new User("Bob", "Jones", "bob@example.com", "anotherSecret456",
                LocalDate.of(1992, 7, 20), "4445556666", "recipient");
        user2.setId(UUID.randomUUID());

        when(userRepository.findAll()).thenReturn(List.of(user1, user2));

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].email").value("alice@example.com"))
                .andExpect(jsonPath("$[0].role").value("donor"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[0].canPostListings").value(true))
                .andExpect(jsonPath("$[0].password").doesNotExist())
                .andExpect(jsonPath("$[1].email").value("bob@example.com"))
                .andExpect(jsonPath("$[1].password").doesNotExist());
    }

    @Test
    void testToggleUserStatus() throws Exception {
        UUID userId = UUID.randomUUID();
        User user = new User("Alice", "Smith", "alice@example.com", "secret",
                LocalDate.of(1998, 2, 14), "1112223333", "donor");
        user.setId(userId);
        user.setStatus("ACTIVE");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(patch("/api/admin/users/" + userId + "/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUSPENDED"));
    }
}
