package com.focusforest.controller;

import com.focusforest.model.User;
import com.focusforest.repository.SessionRepository;
import com.focusforest.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public LeaderboardController(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getLeaderboard() {
        List<Object[]> rows = sessionRepository.getLeaderboard();
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        int rank = 1;
        for (Object[] row : rows) {
            if (rank > 20) break;

            Long userId = ((Number) row[0]).longValue();
            Long totalTime = ((Number) row[1]).longValue();

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) continue;

            User user = userOpt.get();
            Long trees = sessionRepository.getTotalTreesByUser(userId);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank);
            entry.put("name", user.getName());
            entry.put("picture", user.getPicture());
            entry.put("totalFocusTime", totalTime);
            entry.put("totalTrees", trees);
            leaderboard.add(entry);
            rank++;
        }

        return ResponseEntity.ok(leaderboard);
    }
}
