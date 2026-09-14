package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Testing purposes ONLY REMOVE WHEN FINISHED
        if (request.getUsername().equals("admin")
                && request.getPassword().equals("1234")) {
            return ResponseEntity.ok(
                new LoginResponse("success", "Admin", "ADMIN")
            );
        }
        
        Optional<User> userOpt = userRepository.findByEmail(request.getUsername()); // We use username as email

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();
            return ResponseEntity.ok(new LoginResponse("success", user.getName(), user.getRole()));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("error");
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("User already exists");
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
    }}

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