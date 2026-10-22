
package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired(required = false)
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/auth/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Username and password are required"));
        }

        // Test admin fallback credentials
        if ("admin".equals(request.getUsername()) && "1234".equals(request.getPassword())) {
            return ResponseEntity.ok(new LoginResponse("success", "Admin", "ADMIN", null));
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
<<<<<<< HEAD
=======

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
            boolean passwordMatches = (passwordEncoder != null
                    && passwordEncoder.matches(request.getPassword(), user.getPassword()))
                    || user.getPassword().equals(request.getPassword());

            if (passwordMatches) {
                if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                    return ResponseEntity.ok(
                            new LoginResponse("success", user.getName(), "ADMIN", null)
                    );
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new MessageResponse(
                                    "Access denied: Administrator privileges required"
                            ));
                }
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new MessageResponse("Invalid credentials"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryDTO>> getAllUsers() {
        List<UserSummaryDTO> users = userRepository.findAll().stream()
                .map(UserSummaryDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats() {
        long totalUsers = userRepository.count();
        long activeListings = foodRepository.countByStatusIgnoreCase("ACTIVE");
<<<<<<< HEAD
        return ResponseEntity.ok(new AdminStatsDTO(totalUsers, activeListings, 0L));
=======

        return ResponseEntity.ok(
                new AdminStatsDTO(totalUsers, activeListings, 0L)
        );
>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
    }

    @GetMapping("/food/active")
    public ResponseEntity<List<Food>> getActiveFoodListings() {
<<<<<<< HEAD
        List<Food> activeListings = foodRepository.findByStatusIgnoreCase("ACTIVE");
=======
        List<Food> activeListings =
                foodRepository.findByStatusIgnoreCase("ACTIVE");

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        return ResponseEntity.ok(activeListings);
    }

    @GetMapping("/food/archived")
    public ResponseEntity<List<Food>> getArchivedFoodListings() {
<<<<<<< HEAD
        List<Food> archivedListings = foodRepository.findByStatusIgnoreCase("ARCHIVED");
=======
        List<Food> archivedListings =
                foodRepository.findByStatusIgnoreCase("ARCHIVED");

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        return ResponseEntity.ok(archivedListings);
    }

    @PatchMapping("/users/{id}/status")
<<<<<<< HEAD
    public ResponseEntity<?> toggleUserStatus(@PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
=======
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        User user = userOpt.get();

        if (body != null && body.containsKey("status")) {
            user.setStatus(body.get("status").toUpperCase());
        } else {
            if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
                user.setStatus("ACTIVE");
            } else {
                user.setStatus("SUSPENDED");
            }
        }

        userRepository.save(user);

        return ResponseEntity.ok(new UserSummaryDTO(user));
    }

    @PatchMapping("/users/{id}/restrictions")
<<<<<<< HEAD
    public ResponseEntity<?> toggleUserRestrictions(@PathVariable UUID id,
            @RequestBody(required = false) Map<String, Boolean> body) {
=======
    public ResponseEntity<?> toggleUserRestrictions(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Boolean> body) {

>>>>>>> 218bdc58a0b9e38dfb39eecda574b15b21176d03
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }

        User user = userOpt.get();

        if (body != null && body.containsKey("canPostListings")) {
            user.setCanPostListings(body.get("canPostListings"));
        } else {
            user.setCanPostListings(
                    !Boolean.TRUE.equals(user.getCanPostListings())
            );
        }

        userRepository.save(user);

        return ResponseEntity.ok(new UserSummaryDTO(user));
    }

    @PatchMapping("/food/{id}/status")
    public ResponseEntity<?> updateFoodStatus(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        Optional<Food> foodOpt = foodRepository.findById(id);

        if (foodOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Food listing not found"));
        }

        Food food = foodOpt.get();

        String newStatus = body != null && body.containsKey("status")
                ? body.get("status")
                : "REMOVED_BY_ADMIN";

        food.setStatus(newStatus.toUpperCase());

        if (body != null && body.containsKey("removalReason")) {
            food.setRemovalReason(body.get("removalReason"));
        }

        foodRepository.save(food);

        return ResponseEntity.ok(food);
    }
}
