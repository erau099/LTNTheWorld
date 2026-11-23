package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ReportController reportController;

    @Test
    void createsPendingListingReportAndResolvesListingOwner() {
        UUID reporterId = UUID.randomUUID();
        UUID donorId = UUID.randomUUID();

        Food food = new Food();
        food.setId(15L);
        food.setUserId(donorId);

        ReportController.CreateReportRequest req = new ReportController.CreateReportRequest();
        req.setReportType("LISTING");
        req.setFoodListingId(15L);
        req.setReason("Expired or unsafe food");
        req.setDescription("Item appeared spoiled in photos");

        when(authentication.getName()).thenReturn(reporterId.toString());
        when(foodRepository.findById(15L)).thenReturn(Optional.of(food));
        when(reportRepository.save(any(Report.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> res = reportController.createReport(req, authentication);

        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        Report saved = (Report) res.getBody();
        assertNotNull(saved);
        assertEquals("LISTING", saved.getReportType());
        assertEquals("PENDING", saved.getStatus());
        assertEquals(reporterId, saved.getReporterUserId());
        assertEquals(donorId, saved.getReportedUserId());
        assertEquals(15L, saved.getFoodListingId());
    }

    @Test
    void rejectsSelfReport() {
        UUID userId = UUID.randomUUID();
        Food food = new Food();
        food.setId(22L);
        food.setUserId(userId);

        ReportController.CreateReportRequest req = new ReportController.CreateReportRequest();
        req.setFoodListingId(22L);
        req.setReason("Testing");

        when(authentication.getName()).thenReturn(userId.toString());
        when(foodRepository.findById(22L)).thenReturn(Optional.of(food));

        ResponseEntity<?> res = reportController.createReport(req, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        verify(reportRepository, never()).save(any());
    }

    @Test
    void rejectsBlankReason() {
        UUID userId = UUID.randomUUID();
        ReportController.CreateReportRequest req = new ReportController.CreateReportRequest();
        req.setFoodListingId(1L);
        req.setReason("   ");

        when(authentication.getName()).thenReturn(userId.toString());

        ResponseEntity<?> res = reportController.createReport(req, authentication);

        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        verify(reportRepository, never()).save(any());
    }
}
