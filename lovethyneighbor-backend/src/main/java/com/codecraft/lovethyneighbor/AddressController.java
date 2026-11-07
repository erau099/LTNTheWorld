package com.codecraft.lovethyneighbor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    public AddressController(
            AddressRepository addressRepository,
            UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    // Retrieve the authenticated user's saved address.
    @GetMapping("/me")
    public ResponseEntity<?> getMyAddress(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(authentication.getName());

        Optional<Address> address = addressRepository.findByUserId(userId);

        if (address.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(address.get());
    }

    // Create or update the authenticated user's address.
    @PutMapping("/me")
    public ResponseEntity<?> saveMyAddress(
            Authentication authentication,
            @RequestBody Address request) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(authentication.getName());

        if (!userRepository.existsById(userId)) {
            return ResponseEntity.notFound().build();
        }

        if (request == null ||
                isInvalid(request.getStreetAddress(), 255) ||
                isInvalid(request.getCity(), 255) ||
                isInvalid(request.getState(), 255) ||
                isInvalid(request.getZipCode(), 20) ||
                isInvalid(request.getCountry(), 255)) {

            return ResponseEntity.badRequest()
                    .body("All address fields are required and must be within the allowed length.");
        }

        // Reuse an existing address instead of creating duplicates.
        Address address = addressRepository.findByUserId(userId)
                .orElseGet(Address::new);

        // Never trust a user ID supplied in the request body.
        address.setUserId(userId);

        address.setStreetAddress(request.getStreetAddress().trim());
        address.setCity(request.getCity().trim());
        address.setState(request.getState().trim());
        address.setZipCode(request.getZipCode().trim());
        address.setCountry(request.getCountry().trim());

        Address savedAddress = addressRepository.save(address);

        return ResponseEntity.ok(savedAddress);
    }

    private boolean isInvalid(String value, int maxLength) {
        return value == null ||
                value.trim().isEmpty() ||
                value.trim().length() > maxLength;
    }
}
