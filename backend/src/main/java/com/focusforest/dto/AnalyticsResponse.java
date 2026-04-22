package com.focusforest.dto;

import java.util.List;
import java.util.Map;

public class AnalyticsResponse {

    private Long totalFocusTime;
    private Long totalTrees;
    private Long failedSessions;
    private List<Map<String, Object>> dailyStats;
    private List<Map<String, Object>> categoryStats;

    public AnalyticsResponse() {
    }

    public AnalyticsResponse(Long totalFocusTime, Long totalTrees, Long failedSessions,
                             List<Map<String, Object>> dailyStats,
                             List<Map<String, Object>> categoryStats) {
        this.totalFocusTime = totalFocusTime;
        this.totalTrees = totalTrees;
        this.failedSessions = failedSessions;
        this.dailyStats = dailyStats;
        this.categoryStats = categoryStats;
    }

    public Long getTotalFocusTime() {
        return totalFocusTime;
    }

    public void setTotalFocusTime(Long totalFocusTime) {
        this.totalFocusTime = totalFocusTime;
    }

    public Long getTotalTrees() {
        return totalTrees;
    }

    public void setTotalTrees(Long totalTrees) {
        this.totalTrees = totalTrees;
    }

    public Long getFailedSessions() {
        return failedSessions;
    }

    public void setFailedSessions(Long failedSessions) {
        this.failedSessions = failedSessions;
    }

    public List<Map<String, Object>> getDailyStats() {
        return dailyStats;
    }

    public void setDailyStats(List<Map<String, Object>> dailyStats) {
        this.dailyStats = dailyStats;
    }

    public List<Map<String, Object>> getCategoryStats() {
        return categoryStats;
    }

    public void setCategoryStats(List<Map<String, Object>> categoryStats) {
        this.categoryStats = categoryStats;
    }
}
