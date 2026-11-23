package com.codecraft.lovethyneighbor;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RequestMetricsFilter extends OncePerRequestFilter {

    private final DynoCapacityService dynoCapacityService;
    private final AtomicInteger activeRequests = new AtomicInteger(0);

    public RequestMetricsFilter(DynoCapacityService dynoCapacityService) {
        this.dynoCapacityService = dynoCapacityService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri == null || !uri.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        int concurrent = activeRequests.incrementAndGet();
        long startNs = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNs) / 1_000_000L;
            activeRequests.decrementAndGet();
            dynoCapacityService.recordRequestSample(concurrent, durationMs, response.getStatus());
        }
    }
}
