package com.focusforest.controller;

import com.focusforest.model.StudyRoom;
import com.focusforest.model.User;
import com.focusforest.repository.StudyRoomRepository;
import com.focusforest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/rooms")
public class StudyRoomController {

    private final StudyRoomRepository studyRoomRepository;
    private final UserRepository userRepository;

    public StudyRoomController(StudyRoomRepository studyRoomRepository, UserRepository userRepository) {
        this.studyRoomRepository = studyRoomRepository;
        this.userRepository = userRepository;
    }

    private User getUser(OAuth2User principal) {
        String googleId = principal.getAttribute("sub");
        return userRepository.findByGoogleId(googleId).orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@AuthenticationPrincipal OAuth2User principal,
                                        @RequestBody Map<String, Object> body) {
        User user = getUser(principal);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Integer duration = body.get("timerDuration") != null ? ((Number) body.get("timerDuration")).intValue() : 1500;

        String code = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        StudyRoom room = new StudyRoom(code, user.getId(), duration);
        studyRoomRepository.save(room);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("roomCode", code);
        response.put("timerDuration", duration);
        response.put("status", "waiting");
        response.put("hostName", user.getName());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{code}")
    public ResponseEntity<?> getRoom(@PathVariable String code) {
        Optional<StudyRoom> roomOpt = studyRoomRepository.findByRoomCode(code.toUpperCase());
        if (roomOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Room not found"));
        }

        StudyRoom room = roomOpt.get();
        Optional<User> host = userRepository.findById(room.getHostUserId());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("roomCode", room.getRoomCode());
        response.put("timerDuration", room.getTimerDuration());
        response.put("status", room.getStatus());
        response.put("hostName", host.map(User::getName).orElse("Unknown"));
        response.put("createdAt", room.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{code}/start")
    public ResponseEntity<?> startRoom(@AuthenticationPrincipal OAuth2User principal,
                                       @PathVariable String code) {
        User user = getUser(principal);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        Optional<StudyRoom> roomOpt = studyRoomRepository.findByRoomCode(code.toUpperCase());
        if (roomOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Room not found"));

        StudyRoom room = roomOpt.get();
        if (!room.getHostUserId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Only the host can start the timer"));
        }

        room.setStatus("active");
        studyRoomRepository.save(room);

        return ResponseEntity.ok(Map.of("status", "active"));
    }
}
