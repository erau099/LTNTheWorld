package com.codecraft.lovethyneighbor;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "food")
public class Food {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date")
    private LocalDate date;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @Column(name = "\"foodItem\"")
    private String foodItem;

    @Column(name = "description")
    private String description;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tags")
    private String tags;

    @Column(name = "allergens")
    private String allergens;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "removal_reason")
    private String removalReason;

    public Food() {
    }

    public Food(LocalDate date, LocalDateTime pickupTime, String foodItem, String description,
            Long userId, String tags, String allergens) {
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.description = description;
        this.userId = userId;
        this.tags = tags;
        this.allergens = allergens;
        this.status = "ACTIVE";
    }

    public Food(LocalDate date, LocalDateTime pickupTime, String foodItem, String description,
            Long userId, String tags, String allergens, String status) {
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.description = description;
        this.userId = userId;
        this.tags = tags;
        this.allergens = allergens;
        this.status = status != null ? status : "ACTIVE";
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

    public LocalDateTime getPickupEndTime() {
        return pickupEndTime;
    }

    public void setPickupEndTime(LocalDateTime pickupEndTime) {
        this.pickupEndTime = pickupEndTime;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getFoodItem() {
        return foodItem;
    }

    public void setFoodItem(String foodItem) {
        this.foodItem = foodItem;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
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

    public String getStatus() {
        return status != null ? status : "ACTIVE";
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemovalReason() {
        return removalReason;
    }

    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
    }
}
