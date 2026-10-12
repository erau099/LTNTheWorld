
package com.codecraft.lovethyneighbor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

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

    // Existing numeric user ID column
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "tags")
    private String tags;

    @Column(name = "allergens")
    private String allergens;

    @Column(name = "status")
    private String status = "ACTIVE";

    // UUID-based relationship to the User entity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id1",
        foreignKey = @ForeignKey(name = "fk_user_id")
    )
    private User user;

    public Food() {}

    public Food(LocalDate date, LocalDateTime pickupTime,
                String foodItem, String description,
                Long userId, String tags, String allergens) {
        this(date, pickupTime, foodItem, description,
             userId, tags, allergens, "ACTIVE");
    }

    public Food(LocalDate date, LocalDateTime pickupTime,
                String foodItem, String description,
                Long userId, String tags, String allergens,
                String status) {
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

    public void setId(Long id) {
        this.id = id;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
