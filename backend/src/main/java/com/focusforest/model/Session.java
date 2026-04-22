package com.focusforest.model;

import jakarta.persistence.*;

@Entity
@Table(name = "sessions")
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "start_time", nullable = false)
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(nullable = false)
    private Integer duration;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String status;

    public Session() {
    }

    public Session(Long userId, String startTime, String endTime, Integer duration, String category, String status) {
        this.userId = userId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.duration = duration;
        this.category = category;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
