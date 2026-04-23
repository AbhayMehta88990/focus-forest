package com.focusforest.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class StudyWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    // Track participants per room: roomCode -> list of {name, picture}
    private final Map<String, List<Map<String, Object>>> roomParticipants = new ConcurrentHashMap<>();

    public StudyWebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/room/{code}/chat")
    @SendTo("/topic/room/{code}/chat")
    public Map<String, Object> handleChatMessage(@DestinationVariable String code,
                                                  Map<String, Object> message) {
        Map<String, Object> response = new LinkedHashMap<>(message);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    @MessageMapping("/room/{code}/timer")
    @SendTo("/topic/room/{code}/timer")
    public Map<String, Object> handleTimerUpdate(@DestinationVariable String code,
                                                  Map<String, Object> message) {
        Map<String, Object> response = new LinkedHashMap<>(message);
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    @MessageMapping("/room/{code}/join")
    public void handleJoin(@DestinationVariable String code,
                           Map<String, Object> message) {
        String name = (String) message.get("name");
        String picture = (String) message.get("picture");

        // Add to tracked participants
        List<Map<String, Object>> participants = roomParticipants.computeIfAbsent(code, k -> Collections.synchronizedList(new ArrayList<>()));

        // Remove if already exists (reconnect scenario)
        participants.removeIf(p -> name.equals(p.get("name")));

        Map<String, Object> participant = new LinkedHashMap<>();
        participant.put("name", name);
        participant.put("picture", picture);
        participants.add(participant);

        // Send the FULL participant list to all subscribers
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("type", "sync");
        response.put("participants", new ArrayList<>(participants));
        response.put("joinedName", name);
        response.put("timestamp", Instant.now().toString());
        messagingTemplate.convertAndSend("/topic/room/" + code + "/participants", response);
    }

    @MessageMapping("/room/{code}/leave")
    public void handleLeave(@DestinationVariable String code,
                            Map<String, Object> message) {
        String name = (String) message.get("name");

        // Remove from tracked participants
        List<Map<String, Object>> participants = roomParticipants.get(code);
        if (participants != null) {
            participants.removeIf(p -> name.equals(p.get("name")));
            if (participants.isEmpty()) {
                roomParticipants.remove(code);
            }
        }

        // Notify all
        Map<String, Object> response = new LinkedHashMap<>(message);
        response.put("type", "leave");
        response.put("timestamp", Instant.now().toString());
        messagingTemplate.convertAndSend("/topic/room/" + code + "/participants", response);
    }

    // WebRTC signaling relay
    @MessageMapping("/room/{code}/signal")
    @SendTo("/topic/room/{code}/signal")
    public Map<String, Object> handleSignal(@DestinationVariable String code,
                                             Map<String, Object> message) {
        return message;
    }
}
