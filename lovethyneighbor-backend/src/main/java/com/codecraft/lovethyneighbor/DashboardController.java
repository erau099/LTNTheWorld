package com.codecraft.lovethyneighbor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    @GetMapping("/api/donor")
    public String donorDashboard(Authentication authentication) {
        return "Donor dashboard — logged in as user ID: " + authentication.getName();
    }

    @GetMapping("/api/recipient")
    public String recipientDashboard(Authentication authentication) {
        return "Recipient dashboard — logged in as user ID: " + authentication.getName();
    }
}