package com.focusforest.service;

import com.focusforest.dto.AnalyticsResponse;
import com.focusforest.repository.SessionRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final SessionRepository sessionRepository;

    public AnalyticsService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    public AnalyticsResponse getAnalytics(Long userId) {
        Long totalFocusTime = sessionRepository.getTotalFocusTimeByUser(userId);
        Long totalTrees = sessionRepository.getTotalTreesByUser(userId);
        Long failedSessions = sessionRepository.getFailedSessionsByUser(userId);

        List<Object[]> dailyRows = sessionRepository.getDailyStatsByUser(userId);
        List<Map<String, Object>> dailyStats = new ArrayList<>();
        int count = 0;
        for (Object[] row : dailyRows) {
            if (count >= 7) break;
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", row[0]);
            entry.put("duration", ((Number) row[1]).longValue());
            dailyStats.add(entry);
            count++;
        }

        List<Object[]> categoryRows = sessionRepository.getCategoryStatsByUser(userId);
        List<Map<String, Object>> categoryStats = new ArrayList<>();
        for (Object[] row : categoryRows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("category", row[0]);
            entry.put("count", ((Number) row[1]).longValue());
            categoryStats.add(entry);
        }

        return new AnalyticsResponse(totalFocusTime, totalTrees, failedSessions, dailyStats, categoryStats);
    }
}
