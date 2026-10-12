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
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    // Pickup day and window
    @Column(name = "date") private LocalDate date;

    @Column(name = "pickup_time") private LocalDateTime pickupTime;

    @Column(name = "pickup_end_time") private LocalDateTime pickupEndTime;

    @Column(name = "address") private String address;

    @Column(name = "\"foodItem\"") private String foodItem;

    @Column(name = "description") private String description;

    // Donor who posted the listing (logins.id). Always taken from the JWT, never from the request body.
    @Column(name = "user_id") private UUID userId;

    // Same user_id column as a foreign key to logins, read-only so userId stays the one that gets saved
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false, foreignKey = @ForeignKey(name = "fk_user_id"))
    @JsonIgnore
    private User user;

    // Comma-separated, e.g. "Fresh / Hot,Canned"
    @Column(name = "tags") private String tags;

    // Comma-separated, e.g. "Milk,Eggs". Empty means no allergens.
    @Column(name = "allergens") private String allergens;

    // "pending" when posted, then "approved" / "completed"
    @Column(name = "status") private String status;

    @Column(name = "created_at", updatable = false) private LocalDateTime createdAt;

    // Up to 3 photos, stored as base64 data URLs
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "food_photos", joinColumns = @JoinColumn(name = "food_id"))
    @OrderColumn(name = "position")
    @Column(name = "photo", columnDefinition = "TEXT")
    private List<String> photos = new ArrayList<>();


    @Column(name = "removal_reason")
    private String removalReason;

    public Food() {
    }

    public Food(LocalDate date, LocalDateTime pickupTime, String foodItem, String description,
<<<<<<< HEAD
        UUID userId, String tags, String allergens) {
=======
            Long userId, String tags, String allergens) {
>>>>>>> 05c8188 (Complete admin moderation features)
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.description = description;
        this.userId = userId;
        this.tags = tags;
        this.allergens = allergens;
    }

<<<<<<< HEAD
    // Sets the defaults before the listing is saved for the first time
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "pending";
        }
=======
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
>>>>>>> 05c8188 (Complete admin moderation features)
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
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

<<<<<<< HEAD
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public List<String> getPhotos() {
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos;
=======
    public String getRemovalReason() {
        return removalReason;
    }

    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
>>>>>>> 05c8188 (Complete admin moderation features)
    }
}
