package com.codecraft;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.codecraft.lovethyneighbor.*;




@Entity
@Table(name = "food")
public class Food {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @Column(name = "date") private LocalDate date;

    @Column(name = "pickup_time") private LocalDateTime pickupTime;

    @Column(name = "pickup_end_time") private LocalDateTime pickupEndTime;

    @Column(name = "foodItem") private String foodItem;

    @Column(name = "description") private String description;

    @Column(name = "user_id1") private java.util.UUID user_id1;

    @Column(name = "tags") private String tags;

    @Column(name = "allergens") private String allergens;

    @Column(name = "status") private String status;

    @Column(name = "removal_reason") private String removalReason;

    @Column(name = "address") private String address;

    @Column(name = "created_at") private LocalDateTime createdAt;

    @Column(name= "image") private byte[] image;

    @Column(name = "user_id") private int user_id;

    @Column (name = "id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id1", nullable = false)
    private User user;

    public Food() {}

    public Food(LocalDate date, LocalDateTime pickupTime, String foodItem, String description,
        java.util.UUID user_id1, String tags, String allergens, byte[] image, String status, String removalReason, String address, LocalDateTime createdAt  ) {
        this.date = date;
        this.pickupTime = pickupTime;
        this.foodItem = foodItem;
        this.description = description;
        this.user_id1 = user_id1;
        this.tags = tags;
        this.allergens = allergens;
        this.image = image;
        this.status = status;
        this.removalReason = removalReason;
        this.address = address;
        this.createdAt = createdAt;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    public java.util.UUID getUserId() {
        return user_id1;
    }

    public void setUserId(java.util.UUID user_id1) {
        this.user_id1 = user_id1;
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