package com.codecraft.lovethyneighbor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableScheduling // DT-87: runs ListingExpiryService on a timer
@EntityScan(basePackages = "com.codecraft")
public class LovethyneighborApplication {
    public static void main(String[] args) {
        SpringApplication.run(LovethyneighborApplication.class, args);
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.web.client.RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4000);
        factory.setReadTimeout(5000);
        return new org.springframework.web.client.RestTemplate(factory);
    }
}

@RestController
class TestController {
    @GetMapping("/api/hello")
    public String hello() {
        return "Spring Boot is connected!";
    }
}
