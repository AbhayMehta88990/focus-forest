package com.focusforest.repository;

import com.focusforest.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    // User-scoped queries
    List<Session> findAllByUserIdOrderByStartTimeDesc(Long userId);

    @Query("SELECT COALESCE(SUM(s.duration), 0) FROM Session s WHERE s.userId = :uid AND s.status = 'completed'")
    Long getTotalFocusTimeByUser(@Param("uid") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.userId = :uid AND s.status = 'completed'")
    Long getTotalTreesByUser(@Param("uid") Long userId);

    @Query("SELECT COUNT(s) FROM Session s WHERE s.userId = :uid AND s.status = 'failed'")
    Long getFailedSessionsByUser(@Param("uid") Long userId);

    @Query("SELECT SUBSTRING(s.startTime, 1, 10) as date, SUM(s.duration) as duration " +
           "FROM Session s WHERE s.userId = :uid AND s.status = 'completed' " +
           "GROUP BY SUBSTRING(s.startTime, 1, 10) " +
           "ORDER BY SUBSTRING(s.startTime, 1, 10) DESC")
    List<Object[]> getDailyStatsByUser(@Param("uid") Long userId);

    @Query("SELECT s.category, COUNT(s) FROM Session s WHERE s.userId = :uid AND s.status = 'completed' GROUP BY s.category")
    List<Object[]> getCategoryStatsByUser(@Param("uid") Long userId);

    // Global leaderboard queries
    @Query("SELECT s.userId, SUM(s.duration) as totalTime FROM Session s WHERE s.status = 'completed' GROUP BY s.userId ORDER BY totalTime DESC")
    List<Object[]> getLeaderboard();
}
