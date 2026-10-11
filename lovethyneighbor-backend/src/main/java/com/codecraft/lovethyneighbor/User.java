package com.codecraft.lovethyneighbor;

import jakarta.persistence.*;

@Entity
@Table(name = "logins")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private java.util.UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "date_of_birth", nullable = false)
    private java.time.LocalDate dateOfBirth;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(nullable = false)
    private String role; // must be exactly "donor", "recipient", or "both" — lowercase, matches DB CHECK constraint

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "can_post_listings")
    private Boolean canPostListings = true;

    // Default constructor
    public User() {}

    public User(String firstName, String lastName, String email, String password,
                 java.time.LocalDate dateOfBirth, String phoneNumber, String role) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.dateOfBirth = dateOfBirth;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.status = "ACTIVE";
        this.canPostListings = true;
    }

    public User(String firstName, String lastName, String email, String password,
                 java.time.LocalDate dateOfBirth, String phoneNumber, String role,
                 String status, Boolean canPostListings) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.password = password;
        this.dateOfBirth = dateOfBirth;
        this.phoneNumber = phoneNumber;
        this.role = role;
        this.status = status != null ? status : "ACTIVE";
        this.canPostListings = canPostListings != null ? canPostListings : true;
    }

    // Getters and Setters
    public java.util.UUID getId() { return id; }
    public void setId(java.util.UUID id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(java.time.LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status != null ? status : "ACTIVE"; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getCanPostListings() { return canPostListings != null ? canPostListings : true; }
    public void setCanPostListings(Boolean canPostListings) { this.canPostListings = canPostListings; }

    // Convenience method so existing AuthController code (getName()) doesn't break
    public String getName() { return firstName + " " + lastName; }
}