package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        Optional<User> user = userRepository.findById(id);

        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }

        return ResponseEntity.notFound().build();
    }

    // Returns profile information for the currently logged in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());

        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        UserProfileResponse response = new UserProfileResponse(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getDateOfBirth(),
                user.getPhoneNumber(),
                user.getAllergies(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }

    // Updates profile information for the currently logged in user
    @PatchMapping("/me")
    public ResponseEntity<?> updateCurrentUser(
            Authentication authentication,
            @RequestBody UserProfileUpdateRequest request) {

        UUID userId = UUID.fromString(authentication.getName());

        Optional<User> userOpt = userRepository.findById(userId);

        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();

        // Validate first name
        if (request.getFirstName() != null
                && request.getFirstName().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("First name cannot be empty");
        }

        // Validate last name
        if (request.getLastName() != null
                && request.getLastName().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Last name cannot be empty");
        }

        // Validate email
        if (request.getEmail() != null) {
            String email = request.getEmail().trim();

            if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
                return ResponseEntity.badRequest()
                        .body("Invalid email address");
            }
        }

        // Validate date of birth
        if (request.getDateOfBirth() != null
                && request.getDateOfBirth().isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Date of birth cannot be in the future");
        }

        // Validate phone number
        if (request.getPhoneNumber() != null
                && request.getPhoneNumber().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Phone number cannot be empty");
        }

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName().trim());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName().trim());
        }

        if (request.getEmail() != null) {
            String email = request.getEmail().trim();

            Optional<User> existingUser = userRepository.findByEmail(email);

            if (existingUser.isPresent()
                    && !existingUser.get().getId().equals(user.getId())) {

                return ResponseEntity.badRequest()
                        .body("Email is already in use");
            }

            user.setEmail(email);
        }

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber().trim());
        }

        if (request.getAllergies() != null) {
            user.setAllergies(request.getAllergies().trim());
        }

        userRepository.save(user);

        UserProfileResponse response = new UserProfileResponse(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getDateOfBirth(),
                user.getPhoneNumber(),
                user.getAllergies(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }

    // Returns the allergies saved for the currently logged in user
    @GetMapping("/me/allergies")
    public ResponseEntity<?> getCurrentUserAllergies(
            Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());

        Optional<User> user = userRepository.findById(userId);

        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(user.get().getAllergies());
    }

    // Updates only the allergies for the currently logged in user
    @PatchMapping("/me/allergies")
    public ResponseEntity<?> updateCurrentUserAllergies(
            Authentication authentication,
            @RequestBody AllergyUpdateRequest request) {

        UUID userId = UUID.fromString(authentication.getName());

        Optional<User> user = userRepository.findById(userId);

        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User currentUser = user.get();

        currentUser.setAllergies(request.getAllergies());

        userRepository.save(currentUser);

        return ResponseEntity.ok(currentUser.getAllergies());
    }
}

class UserProfileUpdateRequest {

    private String firstName;
    private String lastName;
    private String email;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String allergies;

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAllergies() {
        return allergies;
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

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
}

class UserProfileResponse {

    private String firstName;
    private String lastName;
    private String email;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String allergies;
    private String role;

    public UserProfileResponse(
            String firstName,
            String lastName,
            String email,
            LocalDate dateOfBirth,
            String phoneNumber,
            String allergies,
            String role) {

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.dateOfBirth = dateOfBirth;
        this.phoneNumber = phoneNumber;
        this.allergies = allergies;
        this.role = role;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public String getAllergies() {
        return allergies;
    }

    public String getRole() {
        return role;
    }
}

class AllergyUpdateRequest {

    private String allergies;

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }
}