package com.codecraft.lovethyneighbor;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ReviewRepositoryTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Test
    @DisplayName("findByFoodId should retrieve reviews matching food ID")
    void testFindByFoodId() {
        Long foodId = 5L;
        Review r = new Review();
        r.setRating(4);

        given(reviewRepository.findByFoodId(foodId)).willReturn(List.of(r));

        List<Review> reviews = reviewRepository.findByFoodId(foodId);

        assertEquals(1, reviews.size());
        assertEquals(4, reviews.get(0).getRating());
        verify(reviewRepository).findByFoodId(foodId);
    }

    @Test
    @DisplayName("findByUserId should retrieve reviews matching user UUID")
    void testFindByUserId() {
        UUID userId = UUID.randomUUID();
        Review r = new Review();
        r.setRating(5);

        given(reviewRepository.findByUserId(userId)).willReturn(List.of(r));

        List<Review> reviews = reviewRepository.findByUserId(userId);

        assertEquals(1, reviews.size());
        verify(reviewRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("findByRatingLessThanEqualOrderByCreatedAtDesc should retrieve negative reviews")
    void testFindNegativeReviews() {
        Review lowReview = new Review();
        lowReview.setRating(2);

        given(reviewRepository.findByRatingLessThanEqualOrderByCreatedAtDesc(2))
                .willReturn(List.of(lowReview));

        List<Review> reviews = reviewRepository.findByRatingLessThanEqualOrderByCreatedAtDesc(2);

        assertEquals(1, reviews.size());
        assertEquals(2, reviews.get(0).getRating());
        verify(reviewRepository).findByRatingLessThanEqualOrderByCreatedAtDesc(2);
    }
}