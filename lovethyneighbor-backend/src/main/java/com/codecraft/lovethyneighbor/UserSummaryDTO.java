package com.codecraft.lovethyneighbor;

import java.time.LocalDate;
import java.util.UUID;

public class UserSummaryDTO {
    private UUID id;
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private String role;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String status;
    private Boolean canPostListings;

    public UserSummaryDTO() {}

    public UserSummaryDTO(User user) {
        if (user != null) {
            this.id = user.getId();
            this.firstName = user.getFirstName();
            this.lastName = user.getLastName();
            this.name = user.getName();
            this.email = user.getEmail();
            this.role = user.getRole();
            this.dateOfBirth = user.getDateOfBirth();
            this.phoneNumber = user.getPhoneNumber();
            this.status = user.getStatus();
            this.canPostListings = user.getCanPostListings();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getCanPostListings() { return canPostListings; }
    public void setCanPostListings(Boolean canPostListings) { this.canPostListings = canPostListings; }
}
