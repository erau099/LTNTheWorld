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

    @Column(name = "pickup_end_time")
    private LocalDateTime pickupEndTime;

    @Column(name = "address")
    private String address;

    @Column(name = "\"foodItem\"")
    private String foodItem;

    @Column(name = "description")
    private String description;

    // UUID of donor in logins.id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    // UUID relationship to logins.id
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "user_id",
        insertable = false,
        updatable = false,
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

    @Column(name = "removal_reason")
    private String removalReason;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable (
        name = "food_photos",
        joinColumns = @JoinColumn(name = "food_id")
    )
    @OrderColumn(name = "position")
    @Column(name = "photos", columnDefinition = "BYTEA")
    private List<byte[]> photos = new ArrayList<>();

/* 
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
        name = "food_photos",
        joinColumns = @JoinColumn(name = "food_id")
    )
    @OrderColumn(name = "position")
    @Column(name = "photos", columnDefinition = "TEXT")
    private List<String> photos = new ArrayList<>();
*/


    // Default constructor required by JPA
    public Food() {
    }

    public Food(
            LocalDate date,
            LocalDateTime pickupTime,
            String foodItem,
            String description,
            UUID userId,
            String tags,
            String allergens,
            List<byte[]> photos
    ) {
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.description = description;
        this.userId = userId;
        this.tags = tags;
        this.allergens = allergens;
        this.photos = photos;
    }

    public Food(
            LocalDate date,
            LocalDateTime pickupTime,
            String foodItem,
            String description,
            Long userId,
            String tags,
            String allergens,
            List<byte[]> photos
    ) {
        this(date, pickupTime, foodItem, description, userId != null ? new UUID(0L, userId) : null, tags, allergens,photos);
    }

    public Food(
            LocalDate date,
            LocalDateTime pickupTime,
            String foodItem,
            String description,
            UUID userId,
            String tags,
            String allergens,
            String status,
            List<byte[]> photos
    ) {
        this(date, pickupTime, foodItem, description, userId, tags, allergens, photos);
        this.status = status != null ? status : "ACTIVE";
    }

    public Food(
            LocalDate date,
            LocalDateTime pickupTime,
            String foodItem,
            String description,
            long userId,
            String tags,
            String allergens,
            String status,
            List<byte[]> photos
    ) {
        this(date, pickupTime, foodItem, description, new UUID(0L, userId), tags, allergens, status, photos);
    }

    // Set defaults when the food listing is first saved
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

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId != null ? new UUID(0L, userId) : null;
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

    public List<byte[]> getPhotos() {
        return photos;
    }

    public void setPhotos(List<byte[]> photos) {
        this.photos = photos;
    }

    public String getRemovalReason() {
        return removalReason;
    }

    public void setRemovalReason(String removalReason) {
        this.removalReason = removalReason;
    }

}
