package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // The 'UUID id' parameter automatically validates standard 36-character UUID formats.
    // If a malformed string is provided, Spring returns a 400 Bad Request.
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.notFound().build();
    }
    // Returns the allergies saved for the currently logged-in user
    @GetMapping("/me/allergies")
    public ResponseEntity<?> getCurrentUserAllergies(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());

        Optional<User> user = userRepository.findById(userId);

        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(user.get().getAllergies());
    }

    // Updates only the allergies for the currently logged-in user
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

        return ResponseEntity.ok("Allergies updated");
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
