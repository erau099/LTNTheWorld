package com.codecraft.lovethyneighbor;

import java.util.Optional;

public interface GeocodingService {
    /**
     * Resolves an address string to geographic latitude and longitude coordinates.
     * Returns an empty Optional on geocoding failure or invalid address without throwing exceptions.
     *
     * @param address Text address to geocode
     * @return Optional containing Coordinates (lat, lng), or empty if unresolvable
     */
    Optional<Coordinates> geocode(String address);
}
