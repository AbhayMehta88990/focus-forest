package com.focusforest.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "google_id", unique = true, nullable = false)
    private String googleId;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    private String picture;

    @Column(name = "created_at")
    private String createdAt;

    public User() {
    }

    public User(String googleId, String email, String name, String picture) {
        this.googleId = googleId;
        this.email = email;
        this.name = name;
        this.picture = picture;
        this.createdAt = java.time.Instant.now().toString();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
