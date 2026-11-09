package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    @DisplayName("User.getName() should concatenate firstName and lastName")
    void testGetNameConcatenation() {
        User user = new User();
        user.setFirstName("Maria");
        user.setLastName("Gonzalez");

        assertEquals("Maria Gonzalez", user.getName());
    }

    @Test
    @DisplayName("User.isEmailVerified() should be true if null (legacy) or explicitly true")
    void testIsEmailVerifiedBehavior() {
        User user = new User();

        // DT-332: null counts as true for legacy accounts created before verification
        user.setEmailVerified(null);
        assertTrue(user.isEmailVerified());

        user.setEmailVerified(true);
        assertTrue(user.isEmailVerified());

        user.setEmailVerified(false);
        assertFalse(user.isEmailVerified());
    }

    @Test
    @DisplayName("UserSummaryDTO should copy all properties from User")
    void testUserSummaryDTOMapping() {
        UUID id = UUID.randomUUID();
        User user = new User(
                "Sam",
                "Wilson",
                "sam@example.com",
                "secret",
                LocalDate.of(1990, 8, 15),
                "555-4321",
                "both"
        );
        user.setId(id);
        user.setStatus("ACTIVE");
        user.setCanPostListings(true);

        UserSummaryDTO summary = new UserSummaryDTO(user);

        assertEquals(id, summary.getId());
        assertEquals("Sam Wilson", summary.getName());
        assertEquals("sam@example.com", summary.getEmail());
        assertEquals("both", summary.getRole());
        assertEquals("ACTIVE", summary.getStatus());
        assertTrue(summary.getCanPostListings());
    }

    @Test
    @DisplayName("UserActivityDTO should categorize food statuses into correct counts")
    void testUserActivityDTOCounting() {
        UserSummaryDTO summary = new UserSummaryDTO();

        Food f1 = new Food();
        f1.setStatus("ACTIVE");

        Food f2 = new Food();
        f2.setStatus("CLAIMED");

        Food f3 = new Food();
        f3.setStatus("SCHEDULED"); // also counts as claimed

        Food f4 = new Food();
        f4.setStatus("COMPLETED");

        Food f5 = new Food();
        f5.setStatus("REMOVED_BY_ADMIN");

        UserActivityDTO activity = new UserActivityDTO(summary, List.of(f1, f2, f3, f4, f5));

        assertEquals(5, activity.getTotalListings());
        assertEquals(1, activity.getActiveListings());
        assertEquals(2, activity.getClaimedListings()); // CLAIMED + SCHEDULED
        assertEquals(1, activity.getCompletedListings());
        assertEquals(1, activity.getRemovedListings());
    }
}