package com.codecraft.lovethyneighbor;

import com.codecraft.lovethyneighbor.security.EncryptedStringConverter;
import com.codecraft.lovethyneighbor.security.EncryptedLocalDateConverter;

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
    @Convert(converter = EncryptedLocalDateConverter.class)
    private java.time.LocalDate dateOfBirth;

    // Encrypted using AES-256-GCM with a unique IV for each record, stored in the database as base64-encoded string
    @Column(name = "phone_number")
    @Convert (converter = EncryptedStringConverter.class)
    private String phoneNumber;

    @Column(nullable = false)
    private String role; // must be exactly "donor", "recipient", or "both" — lowercase, matches DB CHECK constraint

    // Stores the date and time when the user account is first created
    @Column(name = "created_at", nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    // Whether the user has clicked the verification link sent to their email
    @Column(name = "verified", nullable = false, columnDefinition = "boolean default false")
    private boolean verified = false;

    // Random token emailed to the user at signup; cleared once verified
    @Column(name = "verification_token")
    private String verificationToken;

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
    }
    
    // Automatically sets the creation timestamp before the user is saved for the first time
    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
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
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    // Convenience method so existing AuthController code (getName()) doesn't break
    public String getName() { return firstName + " " + lastName; }
}