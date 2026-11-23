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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class SecurityAndBoundaryFaultTest {

    @Autowired
    private WebApplicationContext wac;

    @Autowired
    @Qualifier("springSecurityFilterChain")
    private Filter springSecurityFilterChain;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private FoodOrderRepository foodOrderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private EmailService emailService;

    private MockMvc mockMvc;

    private User donorA;
    private User donorB;
    private User restrictedDonor;
    private User recipientA;
    private User recipientB;
    private User bothUser;
    private User adminUser;

    private Cookie cookieFor(User user) {
        return new Cookie("authToken", jwtService.generateToken(user.getId(), user.getRole()));
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(wac)
                .addFilters(springSecurityFilterChain)
                .build();

        reviewRepository.deleteAll();
        foodOrderRepository.deleteAll();
        notificationRepository.deleteAll();
        reportRepository.deleteAll();
        foodRepository.deleteAll();
        userRepository.deleteAll();

        donorA = saveUser("Donor", "Alpha", "donora@test.local", "donor", true, "ACTIVE");
        donorB = saveUser("Donor", "Beta", "donorb@test.local", "donor", true, "ACTIVE");
        restrictedDonor = saveUser("Donor", "Restricted", "restricted@test.local", "donor", false, "ACTIVE");
        recipientA = saveUser("Recip", "Alpha", "recipa@test.local", "recipient", true, "ACTIVE");
        recipientB = saveUser("Recip", "Beta", "recipb@test.local", "recipient", true, "ACTIVE");
        bothUser = saveUser("Both", "User", "both@test.local", "both", true, "ACTIVE");
        adminUser = saveUser("Admin", "Staff", "admin@test.local", "ADMIN", true, "ACTIVE");
    }

    private User saveUser(String first, String last, String email, String role, boolean canPost, String status) {
        User u = new User(first, last, email, passwordEncoder.encode("Password123!"),
                LocalDate.of(1994, 3, 10), "555-010-9999", role, status, canPost);
        u.setEmailVerified(true);
        return userRepository.save(u);
    }

    private Food saveFood(User owner, String status, UUID claimedBy) {
        Food f = new Food();
        f.setUserId(owner.getId());
        f.setFoodItem("Community Soup");
        f.setDescription("Warm soup");
        f.setTags("Fresh / Hot");
        f.setAllergens("");
        f.setAddress("999 Secret Way, Sacramento, CA 95819");
        f.setDate(LocalDate.now().plusDays(1));
        f.setPickupTime(LocalDateTime.now().plusHours(4));
        f.setPickupEndTime(LocalDateTime.now().plusHours(6));
        f.setStatus(status);
        f.setClaimedByUserId(claimedBy);
        if ("COMPLETED".equalsIgnoreCase(status)) {
            f.setCompletedAt(LocalDateTime.now());
        }
        return foodRepository.save(f);
    }

    @Test
    @DisplayName("POST /api/food/seed-test-data is blocked for unauthenticated, non-admin, and admin by default in production")
    void seedTestDataIsDisabledInProduction() throws Exception {
        mockMvc.perform(post("/api/food/seed-test-data"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/food/seed-test-data").cookie(cookieFor(donorA)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/food/seed-test-data").cookie(cookieFor(recipientA)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/food/seed-test-data").cookie(cookieFor(adminUser)))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("disabled")));

        assertEquals(0, foodRepository.count());
    }

    @Test
    @DisplayName("POST /api/auth/change-email requires authentication and blocks cross-account takeover")
    void changeEmailRequiresAuthAndSelfOwnership() throws Exception {
        String takeoverBody = "{\"currentEmail\":\"admin@test.local\",\"newEmail\":\"attacker@evil.local\"}";

        // Unauthenticated caller must be 401
        mockMvc.perform(post("/api/auth/change-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(takeoverBody))
                .andExpect(status().isUnauthorized());

        // Donor trying to hijack admin's email must be 403
        mockMvc.perform(post("/api/auth/change-email")
                        .cookie(cookieFor(donorA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(takeoverBody))
                .andExpect(status().isForbidden());

        assertEquals("admin@test.local", userRepository.findById(adminUser.getId()).orElseThrow().getEmail());

        // Self change succeeds
        mockMvc.perform(post("/api/auth/change-email")
                        .cookie(cookieFor(donorA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentEmail\":\"donora@test.local\",\"newEmail\":\"donora.updated@test.local\"}"))
                .andExpect(status().isOk());

        assertEquals("donora.updated@test.local", userRepository.findById(donorA.getId()).orElseThrow().getEmail());
    }

    @Test
    @DisplayName("GET /api/users/{id} enforces self/admin access and never leaks password or token hashes")
    void getUserByIdEnforcesOwnershipAndRedactsSecrets() throws Exception {
        mockMvc.perform(get("/api/users/" + donorA.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/" + donorA.getId()).cookie(cookieFor(recipientA)))
                .andExpect(status().isForbidden());

        MvcResult selfRes = mockMvc.perform(get("/api/users/" + donorA.getId()).cookie(cookieFor(donorA)))
                .andExpect(status().isOk())
                .andReturn();
        String selfJson = selfRes.getResponse().getContentAsString();
        assertFalse(selfJson.contains("password"), "Password hash must never serialize");
        assertFalse(selfJson.contains("resetTokenHash"), "Reset token hash must never serialize");
        assertFalse(selfJson.contains("verificationTokenHash"), "Verification token hash must never serialize");

        mockMvc.perform(get("/api/users/" + donorA.getId()).cookie(cookieFor(adminUser)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/reviews/food/{foodId} never leaks reviewer PII or donor exact street address")
    void publicReviewsRedactReviewerPiiAndDonorAddress() throws Exception {
        Food completed = saveFood(donorA, "COMPLETED", recipientA.getId());
        Review review = new Review();
        review.setUser(recipientA);
        review.setFood(completed);
        review.setRating(5);
        review.setComment("Wonderful meal!");
        reviewRepository.save(review);

        mockMvc.perform(get("/api/reviews/food/" + completed.getId()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Wonderful meal!")))
                .andExpect(content().string(not(containsString("recipa@test.local"))))
                .andExpect(content().string(not(containsString("555-010-9999"))))
                .andExpect(content().string(not(containsString("1994-03-10"))))
                .andExpect(content().string(not(containsString("999 Secret Way"))))
                .andExpect(content().string(not(containsString("password"))));
    }

    @Test
    @DisplayName("POST /api/food enforces role boundary and admin canPostListings restriction")
    void createFoodEnforcesRoleAndPostingRestriction() throws Exception {
        String payload = String.format(
                "{\"foodItem\":\"Bread\",\"description\":\"Fresh loaf\",\"tags\":[\"Fresh / Hot\"],\"allergens\":[],\"address\":\"100 J St, Sacramento, CA\",\"date\":\"%s\",\"startTime\":\"10:00\",\"endTime\":\"12:00\"}",
                LocalDate.now().plusDays(1));

        mockMvc.perform(post("/api/food").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/food").cookie(cookieFor(recipientA)).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/food").cookie(cookieFor(adminUser)).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/food").cookie(cookieFor(restrictedDonor)).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden())
                .andExpect(content().string(containsString("restricted")));

        mockMvc.perform(post("/api/food").cookie(cookieFor(donorA)).contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Claim, confirm, decline, complete, delete, review, report, notification, and admin mutations enforce cross-role and ownership boundaries")
    void allMutatingEndpointsEnforceRoleAndOwnershipBoundaries() throws Exception {
        Food activeFood = saveFood(donorA, "ACTIVE", null);

        // Claim boundaries: donor-only & admin blocked (403); unauth blocked (401); recipient allowed (200)
        mockMvc.perform(post("/api/orders/" + activeFood.getId()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/orders/" + activeFood.getId()).cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/orders/" + activeFood.getId()).cookie(cookieFor(adminUser)))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/food/" + activeFood.getId() + "/request").cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());

        // Self-claim by BOTH role blocked (400)
        Food bothFood = saveFood(bothUser, "ACTIVE", null);
        mockMvc.perform(post("/api/orders/" + bothFood.getId()).cookie(cookieFor(bothUser)))
                .andExpect(status().isBadRequest());

        // Delete boundaries on unclaimed listing: recipient (403), other donor (403)
        mockMvc.perform(delete("/api/food/" + activeFood.getId()).cookie(cookieFor(recipientA)))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/food/" + activeFood.getId()).cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());

        // Recipient A claims listing
        mockMvc.perform(post("/api/orders/" + activeFood.getId()).cookie(cookieFor(recipientA)))
                .andExpect(status().isOk());

        // Owner cannot delete claimed listing (409)
        mockMvc.perform(delete("/api/food/" + activeFood.getId()).cookie(cookieFor(donorA)))
                .andExpect(status().isConflict());

        // Confirm/decline boundaries: recipient (403), other donor (403)
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/confirm-pickup").cookie(cookieFor(recipientA)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/confirm-pickup").cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/orders/food/" + activeFood.getId() + "/decline-request").cookie(cookieFor(recipientA)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/orders/food/" + activeFood.getId() + "/decline-request").cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());

        // Owner confirms -> SCHEDULED
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/confirm-pickup").cookie(cookieFor(donorA)))
                .andExpect(status().isOk());

        // Complete boundaries: unrelated third party (403); claimant or donor succeeds (200)
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/complete-pickup").cookie(cookieFor(recipientB)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/complete-pickup").cookie(cookieFor(donorB)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/food/" + activeFood.getId() + "/complete-pickup").cookie(cookieFor(donorA)))
                .andExpect(status().isOk());

        // Review boundaries: donor-only (403), non-claimant recipient (403), claimant (200), duplicate (409)
        String reviewBody = String.format("{\"foodId\":%d,\"rating\":5,\"comment\":\"Great!\"}", activeFood.getId());
        mockMvc.perform(post("/api/reviews").cookie(cookieFor(donorA)).contentType(MediaType.APPLICATION_JSON).content(reviewBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reviews").cookie(cookieFor(recipientB)).contentType(MediaType.APPLICATION_JSON).content(reviewBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/reviews").cookie(cookieFor(recipientA)).contentType(MediaType.APPLICATION_JSON).content(reviewBody))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/reviews").cookie(cookieFor(recipientA)).contentType(MediaType.APPLICATION_JSON).content(reviewBody))
                .andExpect(status().isConflict());

        // Report boundaries: self-report blocked (400), valid report created (201)
        String selfReport = String.format("{\"reportType\":\"LISTING\",\"foodListingId\":%d,\"reason\":\"Test\"}", activeFood.getId());
        mockMvc.perform(post("/api/reports").cookie(cookieFor(donorA)).contentType(MediaType.APPLICATION_JSON).content(selfReport))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/reports").cookie(cookieFor(recipientA)).contentType(MediaType.APPLICATION_JSON).content(selfReport))
                .andExpect(status().isCreated());

        // Notification ownership boundary: recipientB cannot mark donorA's notification read
        Notification donorNotif = notificationRepository.findByUserIdOrderByCreatedAtDesc(donorA.getId()).get(0);
        mockMvc.perform(patch("/api/notifications/" + donorNotif.getId() + "/read").cookie(cookieFor(recipientB)))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/notifications/" + donorNotif.getId() + "/read").cookie(cookieFor(donorA)))
                .andExpect(status().isOk());

        // Admin mutation boundaries: donor/recipient get 403, admin gets 200
        Report savedReport = reportRepository.findAll().get(0);
        mockMvc.perform(patch("/api/admin/users/" + donorA.getId() + "/status")
                        .cookie(cookieFor(donorA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/reports/" + savedReport.getId() + "/status")
                        .cookie(cookieFor(recipientA))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/admin/reports/" + savedReport.getId() + "/status")
                        .cookie(cookieFor(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Suspended account with previously issued valid JWT is immediately rejected with 401")
    void suspendedUserSessionIsImmediatelyRevoked() throws Exception {
        Cookie validTokenBeforeSuspension = cookieFor(donorA);

        // Admin suspends donorA
        mockMvc.perform(patch("/api/admin/users/" + donorA.getId() + "/status")
                        .cookie(cookieFor(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\"}"))
                .andExpect(status().isOk());

        // Existing JWT must no longer authenticate
        mockMvc.perform(get("/api/users/me").cookie(validTokenBeforeSuspension))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/food/mine").cookie(validTokenBeforeSuspension))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Password reset succeeds cleanly even if SMTP notification delivery fails")
    void resetPasswordSurvivesSmtpFailure() throws Exception {
        doThrow(new RuntimeException("SMTP unavailable")).when(emailService).sendPasswordResetNotification(anyString());

        // Seed valid reset token hash directly
        String rawToken = "test-reset-token-12345";
        java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
        byte[] hashBytes = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hashBytes) hex.append(String.format("%02x", b));

        donorA.setResetTokenHash(hex.toString());
        donorA.setResetTokenExpiration(LocalDateTime.now().plusMinutes(15));
        userRepository.save(donorA);

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"test-reset-token-12345\",\"newPassword\":\"NewStrong1!\",\"confirmPassword\":\"NewStrong1!\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("success"));

        User updated = userRepository.findById(donorA.getId()).orElseThrow();
        assertNull(updated.getResetTokenHash());
        assertTrue(passwordEncoder.matches("NewStrong1!", updated.getPassword()));
    }
}
