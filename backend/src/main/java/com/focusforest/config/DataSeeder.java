package com.focusforest.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) {
        // No seeding needed — users create sessions through OAuth flow
    }
}
