package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@RestController
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174"
})
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Testing purposes ONLY REMOVE WHEN FINISHED
        if (request.getUsername().equals("admin")
                && request.getPassword().equals("1234")) {
            return ResponseEntity.ok(
                new LoginResponse("success", "Admin", "ADMIN")
            );
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getUsername());

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();
            return ResponseEntity.ok(
                new LoginResponse("success", user.getName(), user.getRole())
            );
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("error");
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("User already exists");
        }

        User newUser = new User(
            request.getFirstName(),
            request.getLastName(),
            request.getEmail(),
            request.getPassword(),
            request.getDateOfBirth(),
            request.getPhoneNumber(),
            request.getRole()
        );

        userRepository.save(newUser);
        return ResponseEntity.ok("success");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            String rawToken = generateResetToken();
            String tokenHash = hashToken(rawToken);

            user.setResetTokenHash(tokenHash);
            user.setResetTokenExpiration(LocalDateTime.now().plusMinutes(30));
            userRepository.save(user);

            String resetLink =
                    "http://localhost:5173/#/reset-password?token=" + rawToken;

            emailService.sendPasswordResetEmail(
                    user.getEmail(),
                    resetLink
            );
        }

        return ResponseEntity.ok(
                "If that email exists, a reset link has been sent."
        );
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {

        if (request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid reset token");
        }

        String tokenHash = hashToken(request.getToken());

        Optional<User> userOpt =
                userRepository.findByResetTokenHash(tokenHash);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or already used reset token");
        }

        User user = userOpt.get();

        if (user.getResetTokenExpiration() == null
                || user.getResetTokenExpiration().isBefore(LocalDateTime.now())) {

            user.setResetTokenHash(null);
            user.setResetTokenExpiration(null);
            userRepository.save(user);

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Reset link has expired");
        }

        if (request.getNewPassword() == null
                || !request.getNewPassword().equals(request.getConfirmPassword())) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Passwords do not match");
        }

        if (!isValidPassword(request.getNewPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(
                        "Password must be at least 8 characters and include "
                        + "uppercase, lowercase, a number, and a special character."
                    );
        }

        user.setPassword(request.getNewPassword());

        // Immediately invalidate token so it can only be used once
        user.setResetTokenHash(null);
        user.setResetTokenExpiration(null);

        userRepository.save(user);

        emailService.sendPasswordResetNotification(user.getEmail());

        return ResponseEntity.ok("success");
    }

    @PostMapping("/change-email")
    public ResponseEntity<?> changeEmail(@RequestBody ChangeEmailRequest request) {
        Optional<User> userOpt =
                userRepository.findByEmail(request.getCurrentEmail());

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
                request.getNewEmail()
        );

        return ResponseEntity.ok("success");
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
                    token.getBytes(StandardCharsets.UTF_8)
            );

            StringBuilder hexString = new StringBuilder();

            for (byte b : hashBytes) {
                hexString.append(String.format("%02x", b));
            }

            return hexString.toString();

        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Could not hash reset token", e);
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

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}

class LoginRequest {
    private String username;
    private String password;

    public String getUsername() { return username; }
    public String getPassword() { return password; }

    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
}

class LoginResponse {
    private String status;
    private String name;
    private String role;

    public LoginResponse(String status, String name, String role) {
        this.status = status;
        this.name = name;
        this.role = role;
    }

    public String getStatus() { return status; }
    public String getName() { return name; }
    public String getRole() { return role; }
}

class SignupRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private java.time.LocalDate dateOfBirth;
    private String phoneNumber;
    private String role;

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getRole() { return role; }

    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setDateOfBirth(java.time.LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setRole(String role) { this.role = role; }
}

class ForgotPasswordRequest {
    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}

class ResetPasswordRequest {
    private String token;
    private String newPassword;
    private String confirmPassword;

    public String getToken() { return token; }
    public String getNewPassword() { return newPassword; }
    public String getConfirmPassword() { return confirmPassword; }

    public void setToken(String token) { this.token = token; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
}

class ChangeEmailRequest {
    private String currentEmail;
    private String newEmail;

    public String getCurrentEmail() { return currentEmail; }
    public String getNewEmail() { return newEmail; }

    public void setCurrentEmail(String currentEmail) { this.currentEmail = currentEmail; }
    public void setNewEmail(String newEmail) { this.newEmail = newEmail; }
}