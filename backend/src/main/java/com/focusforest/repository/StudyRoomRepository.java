package com.focusforest.repository;

import com.focusforest.model.StudyRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudyRoomRepository extends JpaRepository<StudyRoom, Long> {
    Optional<StudyRoom> findByRoomCode(String roomCode);
}
