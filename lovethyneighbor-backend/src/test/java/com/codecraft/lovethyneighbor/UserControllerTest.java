package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserController userController;

    private UUID userId;
    private User testUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User(
                "Alex",
                "Morgan",
                "alex@example.com",
                "hashedPass",
                LocalDate.of(1995, 4, 12),
                "555-0199",
                "donor"
        );
        testUser.setId(userId);
        testUser.setAllergies("Peanuts");
    }

    // ==========================================
    // GET /api/users/{id}
    // ==========================================
    @Nested
    @DisplayName("GET /api/users/{id}")
    class GetUserByIdTests {

        @Test
        @DisplayName("Should return 200 and user when ID exists")
        void shouldReturnUserWhenExists() {
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            ResponseEntity<?> response = userController.getUserById(userId);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals(testUser, response.getBody());
        }

        @Test
        @DisplayName("Should return 404 when ID does not exist")
        void shouldReturnNotFoundWhenMissing() {
            given(userRepository.findById(userId)).willReturn(Optional.empty());

            ResponseEntity<?> response = userController.getUserById(userId);

            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
            assertNull(response.getBody());
        }
    }

    // ==========================================
    // GET /api/users/me
    // ==========================================
    @Nested
    @DisplayName("GET /api/users/me")
    class GetCurrentUserTests {

        @Test
        @DisplayName("Should return current user profile response when authenticated")
        void shouldReturnProfileWhenFound() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            ResponseEntity<?> response = userController.getCurrentUser(authentication);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof UserProfileResponse);

            UserProfileResponse body = (UserProfileResponse) response.getBody();
            assertEquals("Alex", body.getFirstName());
            assertEquals("alex@example.com", body.getEmail());
            assertEquals("Peanuts", body.getAllergies());
        }

        @Test
        @DisplayName("Should return 404 if authenticated user not found in DB")
        void shouldReturnNotFoundWhenUserNotFound() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.empty());

            ResponseEntity<?> response = userController.getCurrentUser(authentication);

            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        }
    }

    // ==========================================
    // PATCH /api/users/me
    // ==========================================
    @Nested
    @DisplayName("PATCH /api/users/me")
    class UpdateCurrentUserTests {

        @Test
        @DisplayName("Should update user profile fields and return updated profile")
        void shouldUpdateProfileSuccessfully() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));
            given(userRepository.findByEmail("alex.new@example.com")).willReturn(Optional.empty());

            UserProfileUpdateRequest updateRequest = new UserProfileUpdateRequest();
            updateRequest.setFirstName("Alexander");
            updateRequest.setEmail("alex.new@example.com");
            updateRequest.setAllergies("Gluten");

            ResponseEntity<?> response = userController.updateCurrentUser(authentication, updateRequest);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof UserProfileResponse);

            UserProfileResponse body = (UserProfileResponse) response.getBody();
            assertEquals("Alexander", body.getFirstName());
            assertEquals("alex.new@example.com", body.getEmail());
            assertEquals("Gluten", body.getAllergies());
            verify(userRepository).save(testUser);
        }

        @Test
        @DisplayName("Should return 400 when first name is only whitespace")
        void shouldFailWhenFirstNameBlank() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            UserProfileUpdateRequest updateRequest = new UserProfileUpdateRequest();
            updateRequest.setFirstName("   ");

            ResponseEntity<?> response = userController.updateCurrentUser(authentication, updateRequest);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("First name cannot be empty", response.getBody());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should return 400 when email format is invalid")
        void shouldFailWhenEmailInvalid() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            UserProfileUpdateRequest updateRequest = new UserProfileUpdateRequest();
            updateRequest.setEmail("invalid-email-address");

            ResponseEntity<?> response = userController.updateCurrentUser(authentication, updateRequest);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Invalid email address", response.getBody());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should return 400 when date of birth is in the future")
        void shouldFailWhenDobInFuture() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            UserProfileUpdateRequest updateRequest = new UserProfileUpdateRequest();
            updateRequest.setDateOfBirth(LocalDate.now().plusDays(2));

            ResponseEntity<?> response = userController.updateCurrentUser(authentication, updateRequest);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Date of birth cannot be in the future", response.getBody());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should return 400 if email is already claimed by a different user")
        void shouldFailWhenEmailTakenByOtherUser() {
            UUID otherUserId = UUID.randomUUID();
            User otherUser = new User();
            otherUser.setId(otherUserId);
            otherUser.setEmail("taken@example.com");

            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));
            given(userRepository.findByEmail("taken@example.com")).willReturn(Optional.of(otherUser));

            UserProfileUpdateRequest updateRequest = new UserProfileUpdateRequest();
            updateRequest.setEmail("taken@example.com");

            ResponseEntity<?> response = userController.updateCurrentUser(authentication, updateRequest);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Email is already in use", response.getBody());
            verify(userRepository, never()).save(any());
        }
    }

    // ==========================================
    // ALLERGIES ENDPOINTS
    // ==========================================
    @Nested
    @DisplayName("Allergies Endpoints")
    class AllergiesTests {

        @Test
        @DisplayName("GET /api/users/me/allergies - Should return current allergies string")
        void shouldGetAllergies() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            ResponseEntity<?> response = userController.getCurrentUserAllergies(authentication);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("Peanuts", response.getBody());
        }

        @Test
        @DisplayName("PATCH /api/users/me/allergies - Should update and return allergies")
        void shouldUpdateAllergies() {
            given(authentication.getName()).willReturn(userId.toString());
            given(userRepository.findById(userId)).willReturn(Optional.of(testUser));

            AllergyUpdateRequest request = new AllergyUpdateRequest();
            request.setAllergies("Dairy, Shellfish");

            ResponseEntity<?> response = userController.updateCurrentUserAllergies(authentication, request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("Dairy, Shellfish", response.getBody());
            verify(userRepository).save(testUser);
        }
    }
}