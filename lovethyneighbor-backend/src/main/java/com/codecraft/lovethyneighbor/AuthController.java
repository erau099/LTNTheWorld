package com.codecraft.lovethyneighbor;

import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/auth")

public class AuthController {
    private static final String VALID_USERNAME = "admin";
    private static final String VALID_PASSWORD = "1234";

    // Take JSON and convert to LoginRequest
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request){
        if(request.getUsername().equals(VALID_USERNAME) && request.getPassword().equals(VALID_PASSWORD)){
            return "success";
        } else{
            return "error";
        }
    }
}

class LoginRequest{
    private String username;
    private String password;

    // Setters and getters
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }

}