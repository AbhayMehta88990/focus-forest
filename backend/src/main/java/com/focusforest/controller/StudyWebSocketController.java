package com.focusforest.controller;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Controller
public class StudyWebSocketController {

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
    @SendTo("/topic/room/{code}/participants")
    public Map<String, Object> handleJoin(@DestinationVariable String code,
                                           Map<String, Object> message) {
        Map<String, Object> response = new LinkedHashMap<>(message);
        response.put("type", "join");
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    @MessageMapping("/room/{code}/leave")
    @SendTo("/topic/room/{code}/participants")
    public Map<String, Object> handleLeave(@DestinationVariable String code,
                                            Map<String, Object> message) {
        Map<String, Object> response = new LinkedHashMap<>(message);
        response.put("type", "leave");
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    // WebRTC signaling relay
    @MessageMapping("/room/{code}/signal")
    @SendTo("/topic/room/{code}/signal")
    public Map<String, Object> handleSignal(@DestinationVariable String code,
                                             Map<String, Object> message) {
        return message;
    }
}
