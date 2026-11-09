package com.codecraft.lovethyneighbor;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Optional;

@Service
public class NominatimGeocodingService implements GeocodingService {

    private static final Logger logger = LoggerFactory.getLogger(NominatimGeocodingService.class);
    private static final String NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
    private static final String USER_AGENT = "LoveThyNeighbor/1.0 (contact@lovethyneighbor.org)";

    private final RestTemplate restTemplate;

    public NominatimGeocodingService() {
        this(new RestTemplate());
    }

    @Autowired
    public NominatimGeocodingService(@Autowired(required = false) RestTemplate restTemplate) {
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
    }

    @Override
    public Optional<Coordinates> geocode(String address) {
        if (address == null || address.trim().isEmpty()) {
            return Optional.empty();
        }

        try {
            URI uri = UriComponentsBuilder.fromUriString(NOMINATIM_URL)
                    .queryParam("q", address.trim())
                    .queryParam("format", "json")
                    .queryParam("limit", 1)
                    .build()
                    .encode()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, USER_AGENT);
            headers.set(HttpHeaders.ACCEPT, "application/json");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<NominatimResult[]> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    entity,
                    NominatimResult[].class
            );

            NominatimResult[] results = response.getBody();
            if (results != null && results.length > 0) {
                NominatimResult first = results[0];
                if (first.getLat() != null && first.getLon() != null) {
                    double lat = Double.parseDouble(first.getLat());
                    double lng = Double.parseDouble(first.getLon());
                    return Optional.of(new Coordinates(lat, lng));
                }
            }

            logger.info("Nominatim returned no coordinates for address: {}", address);
            return Optional.empty();
        } catch (Exception e) {
            logger.warn("Geocoding failed gracefully for address '{}': {}", address, e.getMessage());
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NominatimResult {
        private String lat;
        private String lon;
        private String display_name;

        public NominatimResult() {}

        public NominatimResult(String lat, String lon) {
            this.lat = lat;
            this.lon = lon;
        }

        public String getLat() {
            return lat;
        }

        public void setLat(String lat) {
            this.lat = lat;
        }

        public String getLon() {
            return lon;
        }

        public void setLon(String lon) {
            this.lon = lon;
        }

        public String getDisplay_name() {
            return display_name;
        }

        public void setDisplay_name(String display_name) {
            this.display_name = display_name;
        }
    }
}
