package com.focusforest.controller;

import com.focusforest.dto.AnalyticsResponse;
import com.focusforest.model.User;
import com.focusforest.repository.UserRepository;
import com.focusforest.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAnalytics(@AuthenticationPrincipal OAuth2User principal) {
        String googleId = principal.getAttribute("sub");
        User user = userRepository.findByGoogleId(googleId).orElse(null);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        return ResponseEntity.ok(analyticsService.getAnalytics(user.getId()));
    }
}
