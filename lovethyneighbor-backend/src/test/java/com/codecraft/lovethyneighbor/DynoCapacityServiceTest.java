package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DynoCapacityServiceTest {

    private static final long MB = 1024L * 1024L;

    @Test
    void healthySmallUserbaseOnBasicDynoDoesNotRecommendUpgrade() {
        DynoCapacityService service = new DynoCapacityService(550L, 80.0, 40L, 150L, 10, 15);

        DynoCapacityService.SystemHealthDTO health = service.evaluateWithSnapshot(
                140L * MB,
                280L * MB,
                25L,
                10L,
                0,
                4
        );

        assertFalse(health.upgradeRecommended());
        assertTrue(health.reasons().isEmpty());
        assertEquals("Heroku Standard-2X (1 GB RAM)", health.recommendedPlan());
    }

    @Test
    void highHeapUsageOnBasicDynoRecommendsStandard2x() {
        DynoCapacityService service = new DynoCapacityService(550L, 80.0, 40L, 150L, 10, 15);

        DynoCapacityService.SystemHealthDTO health = service.evaluateWithSnapshot(
                240L * MB,
                280L * MB,
                40L,
                18L,
                2,
                6
        );

        assertTrue(health.upgradeRecommended());
        assertFalse(health.reasons().isEmpty());
        assertTrue(health.message().contains("Standard-2X"));
        assertTrue(health.reasons().stream().anyMatch(r -> r.contains("Peak JVM heap")));
    }

    @Test
    void userAndListingGrowthOnBasicDynoRecommendsUpgrade() {
        DynoCapacityService service = new DynoCapacityService(550L, 80.0, 40L, 150L, 10, 15);

        DynoCapacityService.SystemHealthDTO health = service.evaluateWithSnapshot(
                150L * MB,
                280L * MB,
                175L,
                45L,
                0,
                5
        );

        assertTrue(health.upgradeRecommended());
        assertEquals(2, health.reasons().size());
    }

    @Test
    void alreadyUpgradedTo1GbDynoDoesNotTriggerStandard2xPopup() {
        DynoCapacityService service = new DynoCapacityService(550L, 80.0, 40L, 150L, 10, 15);

        // 1 GB Standard-2X dyno with 60% MaxRAMPercentage gives ~614 MB max heap (>= 550 MB threshold)
        DynoCapacityService.SystemHealthDTO health = service.evaluateWithSnapshot(
                520L * MB,
                614L * MB,
                300L,
                80L,
                15,
                25
        );

        assertFalse(health.upgradeRecommended());
        assertEquals("1 GB+ RAM tier", health.currentTier());
    }
}
