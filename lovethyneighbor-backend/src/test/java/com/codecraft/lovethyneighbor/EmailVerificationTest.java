package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// DT-332: verification link on signup, login blocked until it's clicked
@ExtendWith(MockitoExtension.class)
class EmailVerificationTest {

    private MockMvc mockMvc;

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;

    @InjectMocks private AuthController authController;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authController, "frontendUrl", "http://localhost:5173");
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    private static String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    }

    private User user(Boolean emailVerified) {
        User user = new User("Sam", "Lee", "sam@example.com", "hashed", LocalDate.of(1990, 1, 1), "5555555555", "donor");
        user.setEmailVerified(emailVerified);
        return user;
    }

    private void loginMatches(User user) {
        when(userRepository.findByEmail("sam@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pw", "hashed")).thenReturn(true);
    }

    @Test
    void signupCreatesUnverifiedAccountAndEmailsALink() throws Exception {
        when(userRepository.findByEmail("sam@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Passw0rd!")).thenReturn("hashed");

        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Sam\",\"lastName\":\"Lee\",\"email\":\"sam@example.com\","
                                + "\"password\":\"Passw0rd!\",\"dateOfBirth\":\"1990-01-01\",\"role\":\"donor\"}"))
                .andExpect(status().isOk());

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertFalse(saved.getValue().isEmailVerified());
        assertNotNull(saved.getValue().getVerificationTokenExpiration());

        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendSignupConfirmation(eq("sam@example.com"), eq("Sam"), link.capture());
        assertTrue(link.getValue().startsWith("http://localhost:5173/#/verify-email?token="), link.getValue());

        // Only the hash is stored, and it matches the token in the link
        String rawToken = link.getValue().substring(link.getValue().indexOf("token=") + 6);
        assertEquals(sha256(rawToken), saved.getValue().getVerificationTokenHash());
    }

    @Test
    void signupStillSucceedsWhenTheEmailCannotBeSent() throws Exception {
        when(userRepository.findByEmail("sam@example.com")).thenReturn(Optional.empty());
        doThrow(new RuntimeException("SMTP down")).when(emailService).sendSignupConfirmation(any(), any(), any());

        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Sam\",\"lastName\":\"Lee\",\"email\":\"sam@example.com\","
                                + "\"password\":\"Passw0rd!\",\"dateOfBirth\":\"1990-01-01\",\"role\":\"donor\"}"))
                .andExpect(status().isOk());

        verify(userRepository).save(any(User.class));
    }

    @Test
    void unverifiedAccountCannotLogIn() throws Exception {
        loginMatches(user(false));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sam@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("verify your email")));

        verifyNoInteractions(jwtService);
    }

    @Test
    void verifiedAndExistingAccountsCanLogIn() throws Exception {
        when(jwtService.generateToken(any(), any())).thenReturn("jwt");

        loginMatches(user(true));
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sam@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isOk());

        // Accounts from before verification existed (null) are not locked out
        loginMatches(user(null));
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"sam@example.com\",\"password\":\"pw\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void validLinkVerifiesTheAccountOnce() throws Exception {
        User user = user(false);
        user.setVerificationTokenHash(sha256("abc123"));
        user.setVerificationTokenExpiration(LocalDateTime.now().plusHours(1));
        when(userRepository.findByVerificationTokenHash(sha256("abc123"))).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"abc123\"}"))
                .andExpect(status().isOk());

        assertTrue(user.isEmailVerified());
        assertNull(user.getVerificationTokenHash());
        verify(userRepository).save(user);
    }

    @Test
    void expiredUnknownAndMissingLinksAreRejected() throws Exception {
        User user = user(false);
        user.setVerificationTokenHash(sha256("old"));
        user.setVerificationTokenExpiration(LocalDateTime.now().minusMinutes(1));
        when(userRepository.findByVerificationTokenHash(sha256("old"))).thenReturn(Optional.of(user));

        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"old\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("expired")));
        assertFalse(user.isEmailVerified());

        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"nope\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resendOnlyEmailsUnverifiedAccountsButAnswersTheSameWay() throws Exception {
        User unverified = user(false);
        when(userRepository.findByEmail("sam@example.com")).thenReturn(Optional.of(unverified));
        String unverifiedAnswer = mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"sam@example.com\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        verify(emailService).sendSignupConfirmation(eq("sam@example.com"), eq("Sam"), anyString());
        assertNotNull(unverified.getVerificationTokenHash());

        clearInvocations(emailService);
        when(userRepository.findByEmail("sam@example.com")).thenReturn(Optional.of(user(true)));
        String verifiedAnswer = mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"sam@example.com\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());
        String unknownAnswer = mockMvc.perform(post("/api/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        verifyNoInteractions(emailService);
        assertEquals(unverifiedAnswer, verifiedAnswer);
        assertEquals(unverifiedAnswer, unknownAnswer);
    }
}
