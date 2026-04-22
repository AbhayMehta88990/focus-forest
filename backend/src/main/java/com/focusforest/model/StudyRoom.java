package com.focusforest.model;

import jakarta.persistence.*;

@Entity
@Table(name = "study_rooms")
public class StudyRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_code", unique = true, nullable = false, length = 8)
    private String roomCode;

    @Column(name = "host_user_id", nullable = false)
    private Long hostUserId;

    @Column(name = "timer_duration")
    private Integer timerDuration;

    @Column(nullable = false, length = 20)
    private String status; // waiting, active, completed

    @Column(name = "created_at")
    private String createdAt;

    public StudyRoom() {
    }

    public StudyRoom(String roomCode, Long hostUserId, Integer timerDuration) {
        this.roomCode = roomCode;
        this.hostUserId = hostUserId;
        this.timerDuration = timerDuration;
        this.status = "waiting";
        this.createdAt = java.time.Instant.now().toString();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRoomCode() { return roomCode; }
    public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
    public Long getHostUserId() { return hostUserId; }
    public void setHostUserId(Long hostUserId) { this.hostUserId = hostUserId; }
    public Integer getTimerDuration() { return timerDuration; }
    public void setTimerDuration(Integer timerDuration) { this.timerDuration = timerDuration; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
