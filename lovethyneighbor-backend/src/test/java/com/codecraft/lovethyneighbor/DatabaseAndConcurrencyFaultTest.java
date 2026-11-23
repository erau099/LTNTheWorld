package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DatabaseAndConcurrencyFaultTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private FoodOrderRepository foodOrderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private FoodClaimService foodClaimService;

    @Autowired
    private FoodController foodController;

    @Autowired
    private FoodOrderController foodOrderController;

    private User donor;
    private List<User> recipients;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        foodOrderRepository.deleteAll();
        notificationRepository.deleteAll();
        foodRepository.deleteAll();
        userRepository.deleteAll();

        donor = createUser("Donor", "Concurrency", "donor.conc@test.local", "donor");
        recipients = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            recipients.add(createUser("Recip" + i, "Concurrency", "recip" + i + ".conc@test.local", "recipient"));
        }
    }

    private User createUser(String first, String last, String email, String role) {
        User u = new User(first, last, email, "{noop}Password123!",
                LocalDate.of(1992, 6, 15), "555-019-1234", role);
        u.setEmailVerified(true);
        u.setStatus("ACTIVE");
        return userRepository.save(u);
    }

    private Authentication authFor(User user) {
        return new UsernamePasswordAuthenticationToken(
                user.getId().toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
        );
    }

    private Food createActiveFood() {
        Food food = new Food();
        food.setUserId(donor.getId());
        food.setFoodItem("Concurrency Pasta Tray");
        food.setDescription("Hot pasta tray for neighbors");
        food.setTags("Fresh / Hot");
        food.setAllergens("Wheat");
        food.setAddress("123 Concurrency Ln, Sacramento, CA 95819");
        food.setDate(LocalDate.now().plusDays(1));
        food.setPickupTime(LocalDateTime.now().plusHours(2));
        food.setPickupEndTime(LocalDateTime.now().plusHours(4));
        food.setStatus("ACTIVE");
        return foodRepository.save(food);
    }

    private String makeLargeBase64Photo(char seed, int length) {
        String prefix = "data:image/jpeg;base64,";
        StringBuilder sb = new StringBuilder(length);
        sb.append(prefix);
        while (sb.length() < length) {
            sb.append(seed);
        }
        return sb.substring(0, length);
    }

    @Test
    @DisplayName("Large base64 photo payloads (3 x 1.2 MB) persist and reload intact")
    void largeBase64PhotosPersistAndReload() {
        Food food = createActiveFood();
        List<String> photos = List.of(
                makeLargeBase64Photo('A', 1_200_000),
                makeLargeBase64Photo('B', 1_200_000),
                makeLargeBase64Photo('C', 1_200_000)
        );
        food.setPhotos(new ArrayList<>(photos));
        Food saved = foodRepository.saveAndFlush(food);

        Food reloaded = foodRepository.findById(saved.getId()).orElseThrow();
        assertEquals(3, reloaded.getPhotos().size());
        assertEquals(1_200_000, reloaded.getPhotos().get(0).length());
        assertEquals(1_200_000, reloaded.getPhotos().get(1).length());
        assertEquals(1_200_000, reloaded.getPhotos().get(2).length());
        assertEquals(photos.get(0), reloaded.getPhotos().get(0));
    }

    @Test
    @DisplayName("Review entity automatically populates createdAt on persist")
    void reviewPopulatesCreatedAtOnPersist() {
        Food food = createActiveFood();
        food.setStatus("COMPLETED");
        food.setClaimedByUserId(recipients.get(0).getId());
        food.setCompletedAt(LocalDateTime.now());
        foodRepository.saveAndFlush(food);

        Review review = new Review();
        review.setUser(recipients.get(0));
        review.setFood(food);
        review.setRating(2);
        review.setComment("Late pickup");
        Review saved = reviewRepository.saveAndFlush(review);

        assertNotNull(saved.getId());
        assertNotNull(saved.getCreatedAt(), "Review.createdAt must be populated automatically on fresh databases");
    }

    @Test
    @DisplayName("Concurrent claim race: 5 simultaneous recipients claiming 1 listing yields exactly 1 winner and 1 order")
    void concurrentClaimsAllowOnlyOneWinner() throws Exception {
        Food food = createActiveFood();
        int threads = recipients.size();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<Boolean>> futures = new ArrayList<>();

        for (User recipient : recipients) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                go.await(5, TimeUnit.SECONDS);
                try {
                    foodClaimService.claim(food.getId(), recipient.getId());
                    return true;
                } catch (FoodClaimService.ClaimException expected) {
                    return false;
                }
            }));
        }

        assertTrue(ready.await(5, TimeUnit.SECONDS));
        go.countDown();

        int successes = 0;
        for (Future<Boolean> f : futures) {
            if (Boolean.TRUE.equals(f.get(15, TimeUnit.SECONDS))) {
                successes++;
            }
        }
        pool.shutdownNow();

        assertEquals(1, successes, "Exactly one recipient must win the concurrent claim race");
        Food finalFood = foodRepository.findById(food.getId()).orElseThrow();
        assertEquals("CLAIMED", finalFood.getStatus());
        assertNotNull(finalFood.getClaimedByUserId());
        assertEquals(1, foodOrderRepository.count(), "Only one FoodOrder must exist for the listing");
    }

    @Test
    @DisplayName("Concurrent claim vs delete race: exactly one wins without 500 or orphaned order")
    void concurrentClaimVsDeleteIsSerializedCleanly() throws Exception {
        Food food = createActiveFood();
        User recipient = recipients.get(0);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Future<Integer> claimFuture = pool.submit(() -> {
            ready.countDown();
            go.await(5, TimeUnit.SECONDS);
            try {
                foodClaimService.claim(food.getId(), recipient.getId());
                return 200;
            } catch (FoodClaimService.ClaimException ex) {
                return ex.getStatus().value();
            }
        });

        Future<Integer> deleteFuture = pool.submit(() -> {
            ready.countDown();
            go.await(5, TimeUnit.SECONDS);
            ResponseEntity<?> res = foodController.deleteFoodListing(food.getId(), authFor(donor));
            return res.getStatusCode().value();
        });

        assertTrue(ready.await(5, TimeUnit.SECONDS));
        go.countDown();

        int claimStatus = claimFuture.get(15, TimeUnit.SECONDS);
        int deleteStatus = deleteFuture.get(15, TimeUnit.SECONDS);
        pool.shutdownNow();

        Optional<Food> afterFood = foodRepository.findById(food.getId());
        if (deleteStatus == HttpStatus.NO_CONTENT.value()) {
            assertEquals(HttpStatus.NOT_FOUND.value(), claimStatus, "If delete won, claim must see 404");
            assertTrue(afterFood.isEmpty());
            assertEquals(0, foodOrderRepository.count());
        } else {
            assertEquals(HttpStatus.OK.value(), claimStatus, "If delete lost, claim must have won");
            assertEquals(HttpStatus.CONFLICT.value(), deleteStatus, "Delete after claim must return 409 Conflict");
            assertTrue(afterFood.isPresent());
            assertEquals("CLAIMED", afterFood.get().getStatus());
            assertEquals(1, foodOrderRepository.count());
        }
    }

    @Test
    @DisplayName("Concurrent confirm-pickup calls serialize cleanly with exactly 1 success and no duplicate notifications")
    void concurrentConfirmPickupProducesSingleSuccessAndNoDuplicateNotifications() throws Exception {
        Food food = createActiveFood();
        foodClaimService.claim(food.getId(), recipients.get(0).getId());
        long notificationsBeforeConfirm = notificationRepository.count();

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Callable<Integer> confirmTask = () -> {
            ready.countDown();
            go.await(5, TimeUnit.SECONDS);
            return foodController.confirmPickup(food.getId(), authFor(donor)).getStatusCode().value();
        };

        Future<Integer> f1 = pool.submit(confirmTask);
        Future<Integer> f2 = pool.submit(confirmTask);

        assertTrue(ready.await(5, TimeUnit.SECONDS));
        go.countDown();

        List<Integer> statuses = List.of(f1.get(15, TimeUnit.SECONDS), f2.get(15, TimeUnit.SECONDS));
        pool.shutdownNow();

        assertEquals(1, statuses.stream().filter(s -> s == 200).count(), "Exactly one confirm must succeed");
        assertEquals(1, statuses.stream().filter(s -> s == 409).count(), "Second concurrent confirm must return 409");
        assertEquals(notificationsBeforeConfirm + 2, notificationRepository.count(),
                "Confirming pickup must create exactly 2 notifications (donor + recipient), never duplicates");
    }

    @Test
    @DisplayName("Concurrent confirm-pickup vs decline-request keeps food and order status consistent")
    void concurrentConfirmVsDeclineKeepsStateConsistent() throws Exception {
        Food food = createActiveFood();
        User recipient = recipients.get(0);
        foodClaimService.claim(food.getId(), recipient.getId());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Future<Integer> confirmFuture = pool.submit(() -> {
            ready.countDown();
            go.await(5, TimeUnit.SECONDS);
            return foodController.confirmPickup(food.getId(), authFor(donor)).getStatusCode().value();
        });

        Future<Integer> declineFuture = pool.submit(() -> {
            ready.countDown();
            go.await(5, TimeUnit.SECONDS);
            return foodOrderController.declineRequest(food.getId(), authFor(donor)).getStatusCode().value();
        });

        assertTrue(ready.await(5, TimeUnit.SECONDS));
        go.countDown();

        int confirmStatus = confirmFuture.get(15, TimeUnit.SECONDS);
        int declineStatus = declineFuture.get(15, TimeUnit.SECONDS);
        pool.shutdownNow();

        assertTrue((confirmStatus == 200 && declineStatus == 409)
                        || (confirmStatus == 409 && declineStatus == 200),
                "Exactly one of confirm/decline must return 200 and the other 409; got confirm="
                        + confirmStatus + ", decline=" + declineStatus);

        Food updated = foodRepository.findById(food.getId()).orElseThrow();
        FoodOrder order = foodOrderRepository.findByFoodIdAndRecipientId(food.getId(), recipient.getId()).get(0);
        if (confirmStatus == 200) {
            assertEquals("SCHEDULED", updated.getStatus());
            assertEquals("scheduled", order.getStatus());
        } else {
            assertEquals("ACTIVE", updated.getStatus());
            assertNull(updated.getClaimedByUserId());
            assertEquals("cancelled", order.getStatus());
        }
    }

    @Test
    @DisplayName("Donor can cleanly delete an ACTIVE listing even after a prior claim was declined")
    void donorCanDeleteListingAfterDeclinedClaimWithoutFkViolation() {
        Food food = createActiveFood();
        foodClaimService.claim(food.getId(), recipients.get(0).getId());

        ResponseEntity<?> declineRes = foodOrderController.declineRequest(food.getId(), authFor(donor));
        assertEquals(HttpStatus.OK, declineRes.getStatusCode());

        ResponseEntity<?> deleteRes = foodController.deleteFoodListing(food.getId(), authFor(donor));
        assertEquals(HttpStatus.NO_CONTENT, deleteRes.getStatusCode());
        assertTrue(foodRepository.findById(food.getId()).isEmpty());
        assertEquals(0, foodOrderRepository.count());
    }
}
