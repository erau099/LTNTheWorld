package com.codecraft.lovethyneighbor;

import java.util.Locale;

public final class DistanceUtils {

    // Earth's mean radius in miles
    public static final double EARTH_RADIUS_MILES = 3958.8;

    private DistanceUtils() {}

    /**
     * Calculates the great-circle distance between two points on the Earth's surface in miles
     * using the Haversine formula.
     */
    public static double calculateDistanceMiles(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);

        double c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));

        return EARTH_RADIUS_MILES * c;
    }

    /**
     * Formats distance in miles for user display (e.g., "1.4 miles away", "< 0.1 miles away").
     */
    public static String formatDistance(double miles) {
        if (miles < 0.1) {
            return "< 0.1 miles away";
        }
        return String.format(Locale.US, "%.1f miles away", miles);
    }
}
