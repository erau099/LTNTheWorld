package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.JwtService;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private EmailService emailService;

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    // DT-332: how long a signup verification link stays valid
    static final int VERIFICATION_LINK_HOURS = 24;

    // Where verification links point (the React app)
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Optional<User> userOpt = userRepository.findByEmail(request.getUsername());

        if (userOpt.isPresent()
                && passwordEncoder.matches(
                        request.getPassword(),
                        userOpt.get().getPassword())) {

            User user = userOpt.get();

            // DT-332: new accounts must click the emailed link before logging in
            if (!user.isEmailVerified()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Please verify your email before logging in. Check your inbox for the verification link.");
            }

            // DT-134: Only active accounts are allowed to log in.
            if  (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Account is not active. Please contact support.");
            }

            String token = jwtService.generateToken(
                    user.getId(),
                    user.getRole());

            ResponseCookie authCookie = ResponseCookie.from(
                    "authToken",
                    token)
                    .httpOnly(true)
                    .secure(false)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(60 * 60 * 24)
                    .build();

            LoginResponse response = new LoginResponse(
                    "success",
                    user.getName(),
                    user.getRole(),
                    null,
                    user.getCanPostListings(),
                    user.getStatus());

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.SET_COOKIE,
                            authCookie.toString())
                    .body(response);

        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("error");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {

        ResponseCookie authCookie = ResponseCookie.from(
                "authToken",
                "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.SET_COOKIE,
                        authCookie.toString())
                .body("Logged out");
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("User already exists");
        }

        // Only allow valid account roles to be stored
        String role = request.getRole();

        if (role == null ||
                (!role.equals("donor")
                        && !role.equals("recipient")
                        && !role.equals("both"))) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid role");
        }

        User newUser = new User(
                request.getFirstName(),
                request.getLastName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getDateOfBirth(),
                request.getPhoneNumber(),
                request.getRole());

        // DT-332: account stays locked until the emailed link is clicked
        newUser.setEmailVerified(false);
        String rawToken = issueVerificationToken(newUser);

        userRepository.save(newUser);

        sendVerificationEmail(newUser, rawToken);

        return ResponseEntity.ok("success");
    }

    // DT-332: called by the /verify-email page with the token from the emailed link
    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody VerifyEmailRequest request) {

        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid verification link");
        }

        Optional<User> userOpt = userRepository.findByVerificationTokenHash(hashToken(request.getToken()));

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or already used verification link");
        }

        User user = userOpt.get();

        if (user.getVerificationTokenExpiration() == null
                || user.getVerificationTokenExpiration().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Verification link has expired. Request a new one below.");
        }

        user.setEmailVerified(true);
        user.setVerificationTokenHash(null);
        user.setVerificationTokenExpiration(null);
        userRepository.save(user);

        return ResponseEntity.ok("Your email has been verified. You can now log in.");
    }

    // DT-332: sends a fresh link. Always answers the same way so it can't be used to check which emails exist.
    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody ForgotPasswordRequest request) {

        if (request != null && request.getEmail() != null) {
            userRepository.findByEmail(request.getEmail())
                    .filter(user -> !user.isEmailVerified())
                    .ifPresent(user -> {
                        String rawToken = issueVerificationToken(user);
                        userRepository.save(user);
                        sendVerificationEmail(user, rawToken);
                    });
        }

        return ResponseEntity.ok(
                "If that account still needs verifying, a new link has been sent.");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(
            @RequestBody ForgotPasswordRequest request) {

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {

            User user = userOpt.get();

            String rawToken = generateResetToken();
            String tokenHash = hashToken(rawToken);

            user.setResetTokenHash(tokenHash);
            user.setResetTokenExpiration(
                    LocalDateTime.now().plusMinutes(30));

            userRepository.save(user);

            String resetLink = "http://localhost:5173/#/reset-password?token="
                    + rawToken;

            emailService.sendPasswordResetEmail(
                    user.getEmail(),
                    resetLink);
        }

        return ResponseEntity.ok(
                "If that email exists, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @RequestBody ResetPasswordRequest request) {

        if (request.getToken() == null
                || request.getToken().isBlank()) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid reset token");
        }

        String tokenHash = hashToken(request.getToken());

        Optional<User> userOpt = userRepository.findByResetTokenHash(tokenHash);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or already used reset token");
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null
                || user.getResetTokenExpiration()
                        .isBefore(LocalDateTime.now())) {

            user.setResetTokenHash(null);
            user.setResetTokenExpiration(null);

            userRepository.save(user);

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Reset link has expired");
        }

        if (request.getNewPassword() == null
                || !request.getNewPassword()
                        .equals(request.getConfirmPassword())) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Passwords do not match");
        }

        if (!isValidPassword(request.getNewPassword())) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                            "Password must be at least 8 characters and include "
                                    + "uppercase, lowercase, a number, and a special character.");
        }

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword()));

        // Invalidate token immediately after use
        user.setResetTokenHash(null);
        user.setResetTokenExpiration(null);

        userRepository.save(user);

        emailService.sendPasswordResetNotification(
                user.getEmail());

        return ResponseEntity.ok("success");
    }

    @PostMapping("/change-email")
    public ResponseEntity<?> changeEmail(
            @RequestBody ChangeEmailRequest request) {

        Optional<User> userOpt = userRepository.findByEmail(request.getCurrentEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("User not found");
        }

        if (userRepository.findByEmail(request.getNewEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email already in use");
        }

        User user = userOpt.get();
        String oldEmail = user.getEmail();

        user.setEmail(request.getNewEmail());
        userRepository.save(user);

        emailService.sendEmailChangeNotification(
                oldEmail,
                request.getNewEmail());

        return ResponseEntity.ok("success");
    }

    // Stores the hash of a new verification token on the user and returns the raw token for the email
    private String issueVerificationToken(User user) {
        String rawToken = generateResetToken();
        user.setVerificationTokenHash(hashToken(rawToken));
        user.setVerificationTokenExpiration(LocalDateTime.now().plusHours(VERIFICATION_LINK_HOURS));
        return rawToken;
    }

    // A failed email shouldn't fail signup: the account is saved and the user can resend from the login page
    private void sendVerificationEmail(User user, String rawToken) {
        String link = frontendUrl + "/#/verify-email?token=" + rawToken;
        try {
            emailService.sendSignupConfirmation(user.getEmail(), user.getFirstName(), link);
        } catch (Exception e) {
            log.warn("Could not send verification email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private String generateResetToken() {
        SecureRandom secureRandom = new SecureRandom();

        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(tokenBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hashBytes = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();

            for (byte b : hashBytes) {
                hexString.append(
                        String.format("%02x", b));
            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(
                    "Could not hash reset token",
                    e);
        }
    }

    private boolean isValidPassword(String password) {

        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        boolean hasSpecial = false;

        for (char c : password.toCharArray()) {

            if (Character.isUpperCase(c)) {
                hasUpper = true;

            } else if (Character.isLowerCase(c)) {
                hasLower = true;

            } else if (Character.isDigit(c)) {
                hasDigit = true;

            } else {
                hasSpecial = true;
            }
        }

        return hasUpper
                && hasLower
                && hasDigit
                && hasSpecial;
    }
}

class LoginRequest {
    private String username;
    private String password;

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class LoginResponse {
    private String status;
    private String name;
    private String role;
    private String token;
    private Boolean canPostListings;
    private String accountStatus;

    public LoginResponse(
            String status,
            String name,
            String role) {

        this(status, name, role, null, true, "ACTIVE");
    }

    public LoginResponse(
            String status,
            String name,
            String role,
            String token) {

        this(status, name, role, token, true, "ACTIVE");
    }

    public LoginResponse(
            String status,
            String name,
            String role,
            String token,
            Boolean canPostListings,
            String accountStatus) {

        this.status = status;
        this.name = name;
        this.role = role;
        this.token = token;
        this.canPostListings = canPostListings != null ? canPostListings : true;
        this.accountStatus = accountStatus != null ? accountStatus : "ACTIVE";
    }

    public String getStatus() {
        return status;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getToken() {
        return token;
    }

    public Boolean getCanPostListings() {
        return canPostListings;
    }

    public String getAccountStatus() {
        return accountStatus;
    }
}

class SignupRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private java.time.LocalDate dateOfBirth;
    private String phoneNumber;
    private String role;

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public java.time.LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getRole() {
        return role;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setDateOfBirth(java.time.LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setRole(String role) {
        this.role = role;
    }
}

class ForgotPasswordRequest {
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}

class ResetPasswordRequest {
    private String token;
    private String newPassword;
    private String confirmPassword;

    public String getToken() {
        return token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
}

class ChangeEmailRequest {
    private String currentEmail;
    private String newEmail;

    public String getCurrentEmail() {
        return currentEmail;
    }

    public String getNewEmail() {
        return newEmail;
    }

    public void setCurrentEmail(String currentEmail) {
        this.currentEmail = currentEmail;
    }

    public void setNewEmail(String newEmail) {
        this.newEmail = newEmail;
    }
}

class VerifyEmailRequest {
    private String token;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
