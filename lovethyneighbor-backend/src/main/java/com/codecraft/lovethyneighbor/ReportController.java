package com.codecraft.lovethyneighbor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final FoodRepository foodRepository;

    public ReportController(ReportRepository reportRepository, FoodRepository foodRepository) {
        this.reportRepository = reportRepository;
        this.foodRepository = foodRepository;
    }

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody CreateReportRequest request, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in to submit a report.");
        }

        UUID reporterId;
        try {
            reporterId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid authentication identity.");
        }

        if (request == null || request.getReason() == null || request.getReason().isBlank()) {
            return ResponseEntity.badRequest().body("A report reason is required.");
        }

        String type = request.getReportType() != null && !request.getReportType().isBlank()
                ? request.getReportType().trim().toUpperCase(Locale.ROOT)
                : (request.getFoodListingId() != null ? "LISTING" : "USER");

        if (!"LISTING".equals(type) && !"USER".equals(type)) {
            return ResponseEntity.badRequest().body("Report type must be LISTING or USER.");
        }

        UUID reportedUserId = request.getReportedUserId();
        Long foodListingId = request.getFoodListingId();

        if ("LISTING".equals(type)) {
            if (foodListingId == null) {
                return ResponseEntity.badRequest().body("foodListingId is required when reporting a listing.");
            }
            Optional<Food> foodOpt = foodRepository.findById(foodListingId);
            if (foodOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Food listing not found.");
            }
            if (reportedUserId == null) {
                reportedUserId = foodOpt.get().getUserId();
            }
        } else if (reportedUserId == null) {
            return ResponseEntity.badRequest().body("reportedUserId is required when reporting a user.");
        }

        if (reporterId.equals(reportedUserId)) {
            return ResponseEntity.badRequest().body("You cannot report your own account or listing.");
        }

        Report report = new Report();
        report.setReporterUserId(reporterId);
        report.setReportedUserId(reportedUserId);
        report.setFoodListingId(foodListingId);
        report.setReportType(type);
        report.setReason(request.getReason().trim());
        report.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        report.setStatus("PENDING");

        Report saved = reportRepository.save(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    public static class CreateReportRequest {
        private String reportType;
        private Long foodListingId;
        private UUID reportedUserId;
        private String reason;
        private String description;

        public String getReportType() { return reportType; }
        public void setReportType(String reportType) { this.reportType = reportType; }

        public Long getFoodListingId() { return foodListingId; }
        public void setFoodListingId(Long foodListingId) { this.foodListingId = foodListingId; }

        public UUID getReportedUserId() { return reportedUserId; }
        public void setReportedUserId(UUID reportedUserId) { this.reportedUserId = reportedUserId; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
