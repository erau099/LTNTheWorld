
package com.codecraft.lovethyneighbor;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column(name = "pickup_end_time")
    private LocalDateTime pickupEndTime;

    @Column(name = "address")
    private String address;

    @Column(name = "\"foodItem\"")
    private String foodItem;

    @Column(name = "description")
    private String description;

    // Existing required bigint column.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // UUID relationship to logins.id.
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id1",
        foreignKey = @ForeignKey(name = "fk_user_id")
    )
    private User user;

    @Column(name = "tags")
    private String tags;

    @Column(name = "allergens")
    private String allergens;

    @Column(name = "status")
    private String status;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "food_photos",
        joinColumns = @JoinColumn(name = "food_id")
    )
    @OrderColumn(name = "position")
    @Column(name = "photo", columnDefinition = "TEXT")
    private List<String> photos = new ArrayList<>();

    public Food() {}

    // Constructor retained for compatibility with existing admin tests
public Food(
        LocalDate date,
        LocalDateTime pickupTime,
        String foodItem,
        String description,
        long userId,
        String tags,
        String allergens,
        String status
) {
    this.date = date;
    this.pickupTime = pickupTime;
    this.foodItem = foodItem;
    this.description = description;
    this.userId = userId;
    this.tags = tags;
    this.allergens = allergens;
    this.status = status;
}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null) {
            status = "pending";
        }
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
