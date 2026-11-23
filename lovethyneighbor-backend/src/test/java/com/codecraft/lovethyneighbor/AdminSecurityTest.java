package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.JwtService;
import jakarta.servlet.Filter;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AdminSecurityTest {

    @Autowired
    private WebApplicationContext wac;

    @Autowired
    @Qualifier("springSecurityFilterChain")
    private Filter springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private User donorUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .addFilters(springSecurityFilterChain)
                .build();

        userRepository.deleteAll();

        donorUser = new User("Donor", "User", "donor.sec@example.com", "hashed",
                LocalDate.of(1995, 1, 1), "555-000-0001", "donor");
        donorUser.setStatus("ACTIVE");
        donorUser = userRepository.save(donorUser);

        adminUser = new User("Admin", "User", "admin.sec@example.com", "hashed",
                LocalDate.of(1990, 1, 1), "555-000-0002", "ADMIN");
        adminUser.setStatus("ACTIVE");
        adminUser = userRepository.save(adminUser);
    }

    @Test
    @DisplayName("Unauthenticated requests to /api/admin/stats are rejected with 401")
    void unauthenticatedAdminEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/system-health"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Non-admin authenticated user receives 403 on /api/admin/stats")
    void nonAdminUserReturns403() throws Exception {
        String token = jwtService.generateToken(donorUser.getId(), donorUser.getRole());

        mockMvc.perform(get("/api/admin/stats")
                        .cookie(new Cookie("authToken", token)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Authenticated ADMIN user can access /api/admin/stats")
    void adminUserReturns200() throws Exception {
        String token = jwtService.generateToken(adminUser.getId(), adminUser.getRole());

        mockMvc.perform(get("/api/admin/stats")
                        .cookie(new Cookie("authToken", token)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin login endpoint remains publicly reachable without prior token")
    void adminLoginEndpointIsPermitted() throws Exception {
        mockMvc.perform(post("/api/admin/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"unknown@example.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Public static frontend endpoints do not require authentication")
    void staticFrontendPathsAreNotBlockedBySecurity() throws Exception {
        mockMvc.perform(get("/"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
        mockMvc.perform(get("/firebase-messaging-sw.js"))
                .andExpect(status().is(org.hamcrest.Matchers.not(401)));
    }
}
