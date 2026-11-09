package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthController authController;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User(
                "Jane",
                "Doe",
                "jane@example.com",
                "encodedPassword123",
                LocalDate.of(1995, 5, 20),
                "123-456-7890",
                "donor"
        );
        sampleUser.setEmailVerified(true);
        sampleUser.setStatus("ACTIVE");
    }

    // ==========================================
    // LOGIN TESTS
    // ==========================================

    @Test
    @DisplayName("Login - Success returns 200 and LoginResponse")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setUsername("jane@example.com");
        request.setPassword("Password123!");

        given(userRepository.findByEmail("jane@example.com")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("Password123!", "encodedPassword123")).willReturn(true);
        given(jwtService.generateToken(any(), any())).willReturn("mock-jwt-token");

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof LoginResponse);
        LoginResponse body = (LoginResponse) response.getBody();
        assertEquals("donor", body.getRole());
        assertEquals("success", body.getStatus());
    }

    @Test
    @DisplayName("Login - Wrong Password returns 401")
    void testLoginWrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setUsername("jane@example.com");
        request.setPassword("WrongPassword");

        given(userRepository.findByEmail("jane@example.com")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("WrongPassword", "encodedPassword123")).willReturn(false);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("error", response.getBody());
    }

    @Test
    @DisplayName("Login - Unverified Email returns 403")
    void testLoginUnverifiedEmail() {
        sampleUser.setEmailVerified(false);

        LoginRequest request = new LoginRequest();
        request.setUsername("jane@example.com");
        request.setPassword("Password123!");

        given(userRepository.findByEmail("jane@example.com")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("Password123!", "encodedPassword123")).willReturn(true);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Please verify your email"));
    }

    @Test
    @DisplayName("Login - Suspended status returns 403")
    void testLoginSuspendedAccount() {
        sampleUser.setStatus("SUSPENDED");

        LoginRequest request = new LoginRequest();
        request.setUsername("jane@example.com");
        request.setPassword("Password123!");

        given(userRepository.findByEmail("jane@example.com")).willReturn(Optional.of(sampleUser));
        given(passwordEncoder.matches("Password123!", "encodedPassword123")).willReturn(true);

        ResponseEntity<?> response = authController.login(request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Account is not active"));
    }

    // ==========================================
    // SIGNUP TESTS
    // ==========================================

    @Test
    @DisplayName("Signup - Success saves user and sends verification email")
    void testSignupSuccess() {
        SignupRequest request = new SignupRequest();
        request.setFirstName("John");
        request.setLastName("Smith");
        request.setEmail("john@example.com");
        request.setPassword("Password123!");
        request.setRole("recipient");
        request.setPhoneNumber("555-1234");
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));

        given(userRepository.findByEmail("john@example.com")).willReturn(Optional.empty());
        given(passwordEncoder.encode(anyString())).willReturn("hashedPassword");

        ResponseEntity<?> response = authController.signup(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("success", response.getBody());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Signup - Existing Email returns 400")
    void testSignupEmailAlreadyExists() {
        SignupRequest request = new SignupRequest();
        request.setEmail("jane@example.com");
        request.setRole("donor");

        given(userRepository.findByEmail("jane@example.com")).willReturn(Optional.of(sampleUser));

        ResponseEntity<?> response = authController.signup(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("User already exists", response.getBody());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Signup - Invalid Role returns 400")
    void testSignupInvalidRole() {
        SignupRequest request = new SignupRequest();
        request.setEmail("newuser@example.com");
        request.setRole("admin"); // Not donor, recipient, or both

        ResponseEntity<?> response = authController.signup(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Invalid role", response.getBody());
    }

    // ==========================================
    // LOGOUT & VERIFY EMAIL TESTS
    // ==========================================

    @Test
    @DisplayName("Logout - Returns 200 OK")
    void testLogout() {
        ResponseEntity<?> response = authController.logout();
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Logged out", response.getBody());
    }

    @Test
    @DisplayName("Verify Email - Valid token marks email as verified")
    void testVerifyEmailSuccess() {
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setToken("valid-token");

        sampleUser.setVerificationTokenExpiration(LocalDateTime.now().plusHours(2));
        given(userRepository.findByVerificationTokenHash(anyString())).willReturn(Optional.of(sampleUser));

        ResponseEntity<?> response = authController.verifyEmail(request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(sampleUser.isEmailVerified());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("Verify Email - Expired token returns 400")
    void testVerifyEmailExpired() {
        VerifyEmailRequest request = new VerifyEmailRequest();
        request.setToken("expired-token");

        sampleUser.setVerificationTokenExpiration(LocalDateTime.now().minusHours(1));
        given(userRepository.findByVerificationTokenHash(anyString())).willReturn(Optional.of(sampleUser));

        ResponseEntity<?> response = authController.verifyEmail(request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().toString().contains("Verification link has expired"));
    }
}