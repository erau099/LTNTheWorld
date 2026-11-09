package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GeocodingServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private NominatimGeocodingService geocodingService;

    @BeforeEach
    void setUp() {
        geocodingService = new NominatimGeocodingService(restTemplate);
    }

    @Test
    @DisplayName("Successfully geocode valid Sacramento address into latitude and longitude")
    void testGeocodeSuccess() {
        NominatimGeocodingService.NominatimResult mockResult = new NominatimGeocodingService.NominatimResult();
        mockResult.setLat("38.5601");
        mockResult.setLon("-121.4243");
        mockResult.setDisplay_name("6000 J St, Sacramento, CA 95819, USA");

        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(NominatimGeocodingService.NominatimResult[].class)
        )).thenReturn(new ResponseEntity<>(new NominatimGeocodingService.NominatimResult[]{mockResult}, HttpStatus.OK));

        Optional<Coordinates> coords = geocodingService.geocode("6000 J St, Sacramento, CA");

        assertTrue(coords.isPresent());
        assertEquals(38.5601, coords.get().latitude(), 0.0001);
        assertEquals(-121.4243, coords.get().longitude(), 0.0001);
    }

    @Test
    @DisplayName("Empty or whitespace address returns empty Optional without calling external service")
    void testBlankAddressReturnsEmpty() {
        assertTrue(geocodingService.geocode("").isEmpty());
        assertTrue(geocodingService.geocode("   ").isEmpty());
        assertTrue(geocodingService.geocode(null).isEmpty());
    }

    @Test
    @DisplayName("Graceful fallback when external geocoding service returns no results")
    void testGeocodeNoResultsFallback() {
        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(NominatimGeocodingService.NominatimResult[].class)
        )).thenReturn(new ResponseEntity<>(new NominatimGeocodingService.NominatimResult[0], HttpStatus.OK));

        Optional<Coordinates> coords = geocodingService.geocode("Nonexistent Unknown Place 99999");

        assertTrue(coords.isEmpty());
    }

    @Test
    @DisplayName("Graceful fallback on HTTP timeout or network error without throwing exception")
    void testGeocodeNetworkErrorFallback() {
        when(restTemplate.exchange(
                any(URI.class),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(NominatimGeocodingService.NominatimResult[].class)
        )).thenThrow(new RestClientException("Connection timed out"));

        Optional<Coordinates> coords = assertDoesNotThrow(() ->
                geocodingService.geocode("6000 J St, Sacramento, CA")
        );

        assertTrue(coords.isEmpty());
    }
}
