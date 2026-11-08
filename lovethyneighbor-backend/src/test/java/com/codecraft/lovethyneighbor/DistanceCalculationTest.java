package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class DistanceCalculationTest {

    // CSUS Sacramento State coords: 38.5601, -121.4243
    // Downtown Sacramento (Golden 1 Center): 38.5802, -121.4997 (~4.3 miles)
    // Davis, CA: 38.5449, -121.7405 (~17.2 miles)
    // San Francisco, CA: 37.7749, -122.4194 (~75 miles)

    @Test
    @DisplayName("Verify Haversine distance calculation accuracy in miles")
    void testHaversineDistanceAccuracy() {
        double distToGolden1 = DistanceUtils.calculateDistanceMiles(38.5601, -121.4243, 38.5802, -121.4997);
        assertEquals(4.3, distToGolden1, 0.5);

        double distToDavis = DistanceUtils.calculateDistanceMiles(38.5601, -121.4243, 38.5449, -121.7405);
        assertEquals(17.2, distToDavis, 1.0);

        double distSamePoint = DistanceUtils.calculateDistanceMiles(38.5601, -121.4243, 38.5601, -121.4243);
        assertEquals(0.0, distSamePoint, 0.0001);
    }

    @Test
    @DisplayName("Verify distance formatting (< 0.1 miles vs standard decimal)")
    void testDistanceFormatting() {
        assertEquals("< 0.1 miles away", DistanceUtils.formatDistance(0.04));
        assertEquals("1.4 miles away", DistanceUtils.formatDistance(1.42));
        assertEquals("10.0 miles away", DistanceUtils.formatDistance(10.01));
    }

    @Test
    @DisplayName("Verify distance radius filtering and ascending proximity sorting (closest first)")
    void testDistanceFilterAndSorting() {
        double userLat = 38.5601;
        double userLng = -121.4243; // Sac State

        Food foodDowntown = new Food();
        foodDowntown.setId(1L);
        foodDowntown.setFoodItem("Sandwiches");
        foodDowntown.setLatitude(38.5802);
        foodDowntown.setLongitude(-121.4997); // ~4.3 miles

        Food foodDavis = new Food();
        foodDavis.setId(2L);
        foodDavis.setFoodItem("Apples");
        foodDavis.setLatitude(38.5449);
        foodDavis.setLongitude(-121.7405); // ~17.2 miles

        Food foodSF = new Food();
        foodSF.setId(3L);
        foodSF.setFoodItem("Pastries");
        foodSF.setLatitude(37.7749);
        foodSF.setLongitude(-122.4194); // ~75 miles

        List<Food> listings = new ArrayList<>(List.of(foodSF, foodDowntown, foodDavis));

        double radiusMiles = 10.0;

        List<Food> filtered = listings.stream()
                .peek(f -> {
                    double dist = DistanceUtils.calculateDistanceMiles(userLat, userLng, f.getLatitude(), f.getLongitude());
                    f.setDistanceMiles(dist);
                    f.setFormattedDistance(DistanceUtils.formatDistance(dist));
                })
                .filter(f -> f.getDistanceMiles() <= radiusMiles)
                .sorted((f1, f2) -> Double.compare(f1.getDistanceMiles(), f2.getDistanceMiles()))
                .toList();

        // Only foodDowntown (~4.3 miles) should remain within 10 miles; Davis (17.2) and SF (75) excluded
        assertEquals(1, filtered.size());
        assertEquals("Sandwiches", filtered.get(0).getFoodItem());
        assertTrue(filtered.get(0).getFormattedDistance().contains("miles away"));

        // If radius is 25 miles, both Downtown and Davis should be returned, sorted closest first
        List<Food> filtered25 = listings.stream()
                .peek(f -> {
                    double dist = DistanceUtils.calculateDistanceMiles(userLat, userLng, f.getLatitude(), f.getLongitude());
                    f.setDistanceMiles(dist);
                })
                .filter(f -> f.getDistanceMiles() <= 25.0)
                .sorted((f1, f2) -> Double.compare(f1.getDistanceMiles(), f2.getDistanceMiles()))
                .toList();

        assertEquals(2, filtered25.size());
        assertEquals(1L, filtered25.get(0).getId()); // Downtown first (closest)
        assertEquals(2L, filtered25.get(1).getId()); // Davis second
    }
}
