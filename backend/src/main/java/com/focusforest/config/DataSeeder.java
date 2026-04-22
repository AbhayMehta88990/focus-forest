package com.focusforest.config;

import com.focusforest.repository.SessionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final SessionRepository sessionRepository;

    public DataSeeder(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @Override
    public void run(String... args) {
        // No seeding needed — users create sessions through auth flow
        System.out.println("Focus Forest started. Database tables auto-created by Hibernate.");
    }
}
