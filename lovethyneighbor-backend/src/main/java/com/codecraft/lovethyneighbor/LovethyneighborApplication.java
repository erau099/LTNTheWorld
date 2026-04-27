package com.codecraft.lovethyneighbor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class LovethyneighborApplication {
    public static void main(String[] args) {
        SpringApplication.run(LovethyneighborApplication.class, args);
    }
}

@RestController
@CrossOrigin(origins = "http://localhost:5173")
class TestController {
    @GetMapping("/api/hello")
    public String hello() {
        return "Spring Boot is connected!";
    }
}
