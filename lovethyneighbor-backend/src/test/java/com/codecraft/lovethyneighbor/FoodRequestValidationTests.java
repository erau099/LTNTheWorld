package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FoodRequestValidationTests {

    private FoodController.FoodRequest validRequest() {
        FoodController.FoodRequest request = new FoodController.FoodRequest();
        request.setFoodItem("Donuts");
        request.setDescription("A dozen glazed donuts");
        request.setTags(List.of("Fresh / Hot"));
        request.setAllergens(List.of("Milk", "Eggs"));
        request.setAddress("600 S Clyde Morris Blvd");
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(16, 0));
        request.setEndTime(LocalTime.of(17, 0));
        request.setPhotos(List.of("data:image/jpeg;base64,abc"));
        return request;
    }

    @Test
    void acceptsValidRequest() {
        assertNull(FoodController.validate(validRequest()));
    }

    @Test
    void acceptsNoAllergensOrPhotos() {
        FoodController.FoodRequest request = validRequest();
        request.setAllergens(List.of());
        request.setPhotos(null);
        assertNull(FoodController.validate(request));
    }

    @Test
    void rejectsMissingFields() {
        FoodController.FoodRequest request = validRequest();
        request.setFoodItem("  ");
        assertNotNull(FoodController.validate(request));

        request = validRequest();
        request.setTags(List.of());
        assertNotNull(FoodController.validate(request));
    }

    @Test
    void rejectsPastDate() {
        FoodController.FoodRequest request = validRequest();
        request.setDate(LocalDate.now().minusDays(1));
        assertEquals("Pickup date cannot be in the past.", FoodController.validate(request));
    }

    @Test
    void rejectsEndBeforeStart() {
        FoodController.FoodRequest request = validRequest();
        request.setEndTime(LocalTime.of(15, 0));
        assertEquals("Pickup end time must be after the start time.", FoodController.validate(request));
    }

    @Test
    void rejectsTooManyOrInvalidPhotos() {
        FoodController.FoodRequest request = validRequest();
        request.setPhotos(List.of("data:image/a", "data:image/b", "data:image/c", "data:image/d"));
        assertNotNull(FoodController.validate(request));

        request = validRequest();
        request.setPhotos(List.of("javascript:alert(1)"));
        assertNotNull(FoodController.validate(request));
    }
}
