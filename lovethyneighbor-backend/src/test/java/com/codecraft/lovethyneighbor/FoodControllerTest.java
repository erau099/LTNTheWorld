package com.codecraft.lovethyneighbor;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodControllerTest {

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private FoodClaimService foodClaimService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private FoodController foodController;

    private UUID donorId;
    private UUID recipientId;
    private Food sampleFood;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(foodController, "entityManager", entityManager);

        donorId = UUID.randomUUID();
        recipientId = UUID.randomUUID();

        sampleFood = new Food();
        sampleFood.setId(50L);
        sampleFood.setFoodItem("Apples");
        sampleFood.setUserId(donorId);
        sampleFood.setClaimedByUserId(recipientId);
        sampleFood.setStatus("CLAIMED");
    }

    // ==========================================
    // 1. VALIDATION TESTS
    // ==========================================
    @Nested
    @DisplayName("Validation logic (FoodController.validate)")
    class ValidationTests {

        @Test
        @DisplayName("Should fail when end time is before start time")
        void shouldFailWhenEndTimeBeforeStartTime() {
            FoodController.FoodRequest request = new FoodController.FoodRequest();
            request.setFoodItem("Apples");
            request.setDescription("Fresh apples");
            request.setAddress("123 Main St");
            request.setTags(List.of("fruit"));
            request.setDate(LocalDate.now().plusDays(1));
            request.setStartTime(LocalTime.of(15, 0));
            request.setEndTime(LocalTime.of(14, 0)); // Before start time

            String error = FoodController.validate(request);
            assertEquals("Pickup end time must be after the start time.", error);
        }

        @Test
        @DisplayName("Should fail when photo does not start with data:image/")
        void shouldFailWhenPhotoFormatInvalid() {
            FoodController.FoodRequest request = new FoodController.FoodRequest();
            request.setFoodItem("Apples");
            request.setDescription("Fresh apples");
            request.setAddress("123 Main St");
            request.setTags(List.of("fruit"));
            request.setDate(LocalDate.now().plusDays(1));
            request.setStartTime(LocalTime.of(10, 0));
            request.setEndTime(LocalTime.of(11, 0));
            request.setPhotos(List.of("http://external-image.png"));

            String error = FoodController.validate(request);
            assertEquals("Each photo must be an image under 2.8 MB.", error);
        }
    }

    // ==========================================
    // 2. CREATE FOOD LISTING
    // ==========================================
    @Test
    @DisplayName("POST /api/food - Successfully creates listing with authenticated user ID")
    void shouldCreateFoodListingSuccessfully() {
        FoodController.FoodRequest request = new FoodController.FoodRequest();
        request.setFoodItem("Fresh Bread");
        request.setDescription("Sourdough loaf");
        request.setAddress("456 Elm St");
        request.setTags(List.of("bakery", "bread"));
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(12, 0));

        given(authentication.getName()).willReturn(donorId.toString());
        given(foodRepository.save(any(Food.class))).willAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> response = foodController.createFoodListing(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Food created = (Food) response.getBody();
        assertNotNull(created);
        assertEquals("Fresh Bread", created.getFoodItem());
        assertEquals(donorId, created.getUserId());
    }

    // ==========================================
    // 3. CONFIRM PICKUP
    // ==========================================
    @Test
    @DisplayName("PATCH /api/food/{id}/confirm-pickup - Moves status to SCHEDULED")
    void shouldConfirmPickupSuccessfully() {
        given(authentication.getName()).willReturn(donorId.toString());
        given(foodRepository.findById(50L)).willReturn(Optional.of(sampleFood));
        given(foodRepository.save(any(Food.class))).willAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> response = foodController.confirmPickup(50L, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        Food updated = (Food) response.getBody();
        assertEquals("SCHEDULED", updated.getStatus());
        verify(foodClaimService).updateOrderStatus(sampleFood, "scheduled");
        verify(notificationRepository, times(2)).save(any(Notification.class)); // 1 for donor, 1 for recipient
    }

    // ==========================================
    // 4. COMPLETE PICKUP
    // ==========================================
    @Test
    @DisplayName("PATCH /api/food/{id}/complete-pickup - Fails 403 if user is neither donor nor recipient")
    void shouldForbidUnauthorizedUserFromCompleting() {
        UUID strangerId = UUID.randomUUID();
        sampleFood.setStatus("SCHEDULED");

        given(authentication.getName()).willReturn(strangerId.toString());
        given(foodRepository.findById(50L)).willReturn(Optional.of(sampleFood));

        ResponseEntity<?> response = foodController.completePickup(50L, authentication);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Only the donor or recipient can mark this pickup as completed.", response.getBody());
    }

    // ==========================================
    // GET /api/food (Recipient dashboard active listings)
    // ==========================================

    @Test
    @DisplayName("GET /api/food - Should return all active food listings")
    void shouldReturnAllActiveFoodListings() {
        // Arrange
        Food activeFood1 = new Food();
        activeFood1.setId(1L);
        activeFood1.setStatus("ACTIVE");

        Food activeFood2 = new Food();
        activeFood2.setId(2L);
        activeFood2.setStatus("ACTIVE");

        given(foodRepository.findByStatusIgnoreCase("ACTIVE"))
                .willReturn(List.of(activeFood1, activeFood2));

        // Act
        ResponseEntity<List<Food>> response = foodController.getAllActiveFood(null, null, null);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().size());
        verify(foodRepository).findByStatusIgnoreCase("ACTIVE");
    }

    // ==========================================
    // GET /api/food/{id} (Fetch single listing)
    // ==========================================

    @Test
    @DisplayName("GET /api/food/{id} - Should return food when exists")
    void shouldReturnFoodByIdWhenFound() {
        // Arrange
        given(foodRepository.findById(50L)).willReturn(Optional.of(sampleFood));

        // Act
        ResponseEntity<?> response = foodController.getFoodById(50L);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(sampleFood, response.getBody());
    }

    @Test
    @DisplayName("GET /api/food/{id} - Should return 404 when listing does not exist")
    void shouldReturn404WhenFoodNotFound() {
        // Arrange
        given(foodRepository.findById(999L)).willReturn(Optional.empty());

        // Act
        ResponseEntity<?> response = foodController.getFoodById(999L);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    // ==========================================
    // GET /api/food/mine (Donor dashboard listing fetch)
    // ==========================================

    @Test
    @DisplayName("GET /api/food/mine - Resolves recipient name and review details")
    void shouldReturnDonorListingsWithRecipientAndReview() {
        // Arrange
        UUID claimedRecipientId = UUID.randomUUID();
        sampleFood.setClaimedByUserId(claimedRecipientId);

        User mockRecipient = new User();
        mockRecipient.setFirstName("Charlie");
        mockRecipient.setLastName("Brown");

        Review mockReview = new Review();
        mockReview.setRating(5);
        mockReview.setComment("Excellent meal!");

        given(authentication.getName()).willReturn(donorId.toString());
        given(foodRepository.findByUser_IdOrderByCreatedAtDesc(donorId)).willReturn(List.of(sampleFood));
        given(entityManager.find(User.class, claimedRecipientId)).willReturn(mockRecipient);
        given(reviewRepository.findByFoodId(sampleFood.getId())).willReturn(List.of(mockReview));

        // Act
        ResponseEntity<?> response = foodController.getMyListings(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        List<DonorListingResponse> responseList = (List<DonorListingResponse>) response.getBody();
        assertNotNull(responseList);
        assertEquals(1, responseList.size());

        DonorListingResponse listing = responseList.get(0);
        assertEquals(sampleFood.getId(), listing.getId());
        assertEquals("Charlie Brown", listing.getRecipientName());
        assertEquals(5, listing.getReviewRating());
        assertEquals("Excellent meal!", listing.getReviewComment());
    }

    @Test
    @DisplayName("GET /api/food/mine - Falls back to 'Unclaimed' when food has no recipient")
    void shouldReturnUnclaimedWhenNoRecipient() {
        // Arrange
        sampleFood.setClaimedByUserId(null); // Unclaimed

        given(authentication.getName()).willReturn(donorId.toString());
        given(foodRepository.findByUser_IdOrderByCreatedAtDesc(donorId)).willReturn(List.of(sampleFood));
        given(reviewRepository.findByFoodId(sampleFood.getId())).willReturn(List.of()); // No reviews

        // Act
        ResponseEntity<?> response = foodController.getMyListings(authentication);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        List<DonorListingResponse> responseList = (List<DonorListingResponse>) response.getBody();
        assertNotNull(responseList);
        assertEquals("Unclaimed", responseList.get(0).getRecipientName());
        assertNull(responseList.get(0).getReviewRating());
    }
}