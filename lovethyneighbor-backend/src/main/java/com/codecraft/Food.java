package com.codecraft.lovethyneighbor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "food")
public class Food {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @Column(name = "date") private LocalDate date;

    @Column(name = "pickup_time") private LocalDateTime pickupTime;

    @Column(name = "\"foodItem\"") private String foodItem;

    @Column(name = "user_id") private Long userId;

    @Column(name = "tags") private String tags;

    @Column(name = "allergens") private String allergens;

    public Food() {}

    public Food(LocalDate date, LocalDateTime pickupTime, String foodItem,
        Long userId, String tags, String allergens) {
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.userId = userId;
        this.tags = tags;
        this.allergens = allergens;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalDateTime getPickupTime() {
        return pickupTime;
    }

    public void setPickupTime(LocalDateTime pickupTime) {
        this.pickupTime = pickupTime;
    }

    public String getFoodItem() {
        return foodItem;
    }

    public void setFoodItem(String foodItem) {
        this.foodItem = foodItem;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getAllergens() {
        return allergens;
    }

    public void setAllergens(String allergens) {
        this.allergens = allergens;
    }
}