package com.focusforest.controller;

import com.focusforest.dto.SessionRequest;
import com.focusforest.model.Session;
import com.focusforest.model.User;
import com.focusforest.repository.SessionRepository;
import com.focusforest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public SessionController(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    private User getUser(OAuth2User principal) {
        String googleId = principal.getAttribute("sub");
        return userRepository.findByGoogleId(googleId).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getAllSessions(@AuthenticationPrincipal OAuth2User principal) {
        User user = getUser(principal);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(sessionRepository.findAllByUserIdOrderByStartTimeDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createSession(@AuthenticationPrincipal OAuth2User principal,
                                           @RequestBody SessionRequest request) {
        User user = getUser(principal);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        if (request.getStartTime() == null || request.getStartTime().isBlank() ||
            request.getDuration() == null ||
            request.getCategory() == null || request.getCategory().isBlank() ||
            request.getStatus() == null || request.getStatus().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        Session session = new Session(
                user.getId(),
                request.getStartTime(),
                request.getEndTime(),
                request.getDuration(),
                request.getCategory(),
                request.getStatus()
        );

        Session saved = sessionRepository.save(session);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", saved.getId());
        response.put("startTime", saved.getStartTime());
        response.put("endTime", saved.getEndTime());
        response.put("duration", saved.getDuration());
        response.put("category", saved.getCategory());
        response.put("status", saved.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
