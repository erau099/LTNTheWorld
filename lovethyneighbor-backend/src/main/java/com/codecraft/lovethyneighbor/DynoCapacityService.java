package com.codecraft.lovethyneighbor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryUsage;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class DynoCapacityService {

    private final long maxHeapThresholdMb;
    private final double heapPercentThreshold;
    private final long activeListingsThreshold;
    private final long usersThreshold;
    private final int slowRequestsThreshold;
    private final int concurrencyThreshold;

    private final AtomicInteger peakConcurrentRequests = new AtomicInteger(0);
    private final AtomicInteger slowRequests = new AtomicInteger(0);
    private final AtomicLong peakHeapPercentTenths = new AtomicLong(0);

    public DynoCapacityService(
            @Value("${app.capacity.max-heap-threshold-mb:550}") long maxHeapThresholdMb,
            @Value("${app.capacity.heap-percent-threshold:80.0}") double heapPercentThreshold,
            @Value("${app.capacity.active-listings-threshold:40}") long activeListingsThreshold,
            @Value("${app.capacity.users-threshold:150}") long usersThreshold,
            @Value("${app.capacity.slow-requests-threshold:10}") int slowRequestsThreshold,
            @Value("${app.capacity.concurrency-threshold:15}") int concurrencyThreshold
    ) {
        this.maxHeapThresholdMb = maxHeapThresholdMb;
        this.heapPercentThreshold = heapPercentThreshold;
        this.activeListingsThreshold = activeListingsThreshold;
        this.usersThreshold = usersThreshold;
        this.slowRequestsThreshold = slowRequestsThreshold;
        this.concurrencyThreshold = concurrencyThreshold;
    }

    public void recordRequestSample(int currentConcurrent, long durationMs, int status) {
        peakConcurrentRequests.accumulateAndGet(currentConcurrent, Math::max);
        if (durationMs >= 1500 || status >= 500) {
            slowRequests.incrementAndGet();
        }
        sampleCurrentHeap();
    }

    public double sampleCurrentHeap() {
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        long maxBytes = heap.getMax() > 0 ? heap.getMax() : Runtime.getRuntime().maxMemory();
        if (maxBytes <= 0) return 0.0;
        double pct = (heap.getUsed() * 100.0) / maxBytes;
        long tenths = Math.round(pct * 10.0);
        peakHeapPercentTenths.accumulateAndGet(tenths, Math::max);
        return pct;
    }

    public SystemHealthDTO evaluateCapacity(long totalUsers, long activeListings) {
        MemoryUsage heap = ManagementFactory.getMemoryMXBean().getHeapMemoryUsage();
        long maxBytes = heap.getMax() > 0 ? heap.getMax() : Runtime.getRuntime().maxMemory();
        long usedBytes = heap.getUsed();
        return evaluateWithSnapshot(
                usedBytes,
                maxBytes,
                totalUsers,
                activeListings,
                slowRequests.get(),
                peakConcurrentRequests.get()
        );
    }

    SystemHealthDTO evaluateWithSnapshot(
            long heapUsedBytes,
            long heapMaxBytes,
            long totalUsers,
            long activeListings,
            int observedSlowRequests,
            int observedPeakConcurrency
    ) {
        double heapUsedMb = roundOneDecimal(heapUsedBytes / (1024.0 * 1024.0));
        double heapMaxMb = roundOneDecimal(heapMaxBytes / (1024.0 * 1024.0));
        double currentHeapPct = heapMaxBytes > 0 ? roundOneDecimal((heapUsedBytes * 100.0) / heapMaxBytes) : 0.0;
        long currentTenths = Math.round(currentHeapPct * 10.0);
        long peakTenths = Math.max(peakHeapPercentTenths.get(), currentTenths);
        double peakHeapPct = roundOneDecimal(peakTenths / 10.0);

        boolean on512MbTier = heapMaxMb > 0 && heapMaxMb < maxHeapThresholdMb;
        List<String> reasons = new ArrayList<>();

        if (on512MbTier) {
            if (peakHeapPct >= heapPercentThreshold) {
                reasons.add(String.format("Peak JVM heap reached %.1f%% of %.0f MB", peakHeapPct, heapMaxMb));
            }
            if (activeListings >= activeListingsThreshold) {
                reasons.add(String.format("%d active photo listings are nearing 512 MB cache/payload capacity", activeListings));
            }
            if (totalUsers >= usersThreshold) {
                reasons.add(String.format("%d registered neighbors are actively using the platform", totalUsers));
            }
            if (observedSlowRequests >= slowRequestsThreshold) {
                reasons.add(String.format("%d slow or failed API requests detected under load", observedSlowRequests));
            }
            if (observedPeakConcurrency >= concurrencyThreshold) {
                reasons.add(String.format("Peak concurrency reached %d simultaneous requests", observedPeakConcurrency));
            }
        }

        boolean upgradeRecommended = on512MbTier && !reasons.isEmpty();
        String currentTier = on512MbTier ? "512 MB tier (Heroku Basic / Standard-1X)" : "1 GB+ RAM tier";
        String recommendedPlan = "Heroku Standard-2X (1 GB RAM)";
        String headline = upgradeRecommended
                ? "Good news — Love Thy Neighbor is growing!"
                : "Server capacity is healthy";
        String message = upgradeRecommended
                ? "We are reaching and helping more users, and demand is growing beyond what our current 512 MB dyno setup can comfortably serve. We recommend upgrading to Heroku Standard-2X (1 GB RAM), as Standard-1X still only provides 512 MB of memory."
                : "Current memory, concurrency, and active listing volume are within comfortable operating limits.";

        return new SystemHealthDTO(
                upgradeRecommended,
                currentTier,
                recommendedPlan,
                heapUsedMb,
                heapMaxMb,
                peakHeapPct,
                totalUsers,
                activeListings,
                observedSlowRequests,
                observedPeakConcurrency,
                reasons,
                headline,
                message
        );
    }

    private static double roundOneDecimal(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    public record SystemHealthDTO(
            boolean upgradeRecommended,
            String currentTier,
            String recommendedPlan,
            double heapUsedMb,
            double heapMaxMb,
            double peakHeapPercent,
            long totalUsers,
            long activeListings,
            int slowRequests,
            int peakConcurrentRequests,
            List<String> reasons,
            String headline,
            String message
    ) {}
}
