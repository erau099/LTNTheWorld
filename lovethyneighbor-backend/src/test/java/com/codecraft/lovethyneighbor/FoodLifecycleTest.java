package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class FoodLifecycleTest {

    private MockMvc mockMvc;

    @Mock
    private FoodRepository foodRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private FoodController foodController;

    private UUID donorId;
    private UUID recipientId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(foodController).build();
        donorId = UUID.randomUUID();
        recipientId = UUID.randomUUID();
    }

    @Test
    void testRequestFoodListing_Success() throws Exception {
        Food food = new Food(LocalDate.now(), LocalDateTime.now(), "Bagels", "Dozen sesame bagels", donorId, "Bakery", "Gluten", "ACTIVE");
        food.setId(501L);

        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(post("/api/food/501/request")
                .principal(new TestingAuthenticationToken(recipientId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CLAIMED"))
                .andExpect(jsonPath("$.claimedByUserId").value(recipientId.toString()));

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testRequestFoodListing_AlreadyClaimed() throws Exception {
        Food food = new Food(LocalDate.now(), LocalDateTime.now(), "Bagels", "Dozen sesame bagels", donorId, "Bakery", "Gluten", "CLAIMED");
        food.setId(501L);

        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));

        mockMvc.perform(post("/api/food/501/request")
                .principal(new TestingAuthenticationToken(recipientId.toString(), null)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testConfirmPickup_Success() throws Exception {
        Food food = new Food(LocalDate.now(), LocalDateTime.now(), "Bagels", "Dozen sesame bagels", donorId, "Bakery", "Gluten", "CLAIMED");
        food.setId(501L);
        food.setClaimedByUserId(recipientId);

        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(patch("/api/food/501/confirm-pickup")
                .principal(new TestingAuthenticationToken(donorId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SCHEDULED"));

        verify(notificationRepository, org.mockito.Mockito.times(2)).save(any(Notification.class));
    }

    @Test
    void testCompletePickup_Success() throws Exception {
        Food food = new Food(LocalDate.now(), LocalDateTime.now(), "Bagels", "Dozen sesame bagels", donorId, "Bakery", "Gluten", "SCHEDULED");
        food.setId(501L);
        food.setClaimedByUserId(recipientId);

        when(foodRepository.findById(501L)).thenReturn(Optional.of(food));
        when(foodRepository.save(any(Food.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(patch("/api/food/501/complete-pickup")
                .principal(new TestingAuthenticationToken(donorId.toString(), null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        verify(notificationRepository, org.mockito.Mockito.times(2)).save(any(Notification.class));
    }
}
