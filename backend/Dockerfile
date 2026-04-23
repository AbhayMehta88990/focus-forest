# Build stage
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Package stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/target/focus-forest-backend-1.0.0.jar app.jar

# Import Aiven CA into Java's DEFAULT truststore (keeps Google/other CAs intact)
COPY ca.pem /app/ca.pem
RUN keytool -importcert -alias aiven-ca -file /app/ca.pem \
    -keystore $JAVA_HOME/lib/security/cacerts -storepass changeit -noprompt

EXPOSE 3001

# Startup script with proper quoting for env vars
RUN printf '#!/bin/sh\nexec java \\\n  -Dspring.security.oauth2.client.registration.google.client-id="${GOOGLE_CLIENT_ID}" \\\n  -Dspring.security.oauth2.client.registration.google.client-secret="${GOOGLE_CLIENT_SECRET}" \\\n  -jar app.jar\n' > /app/start.sh && chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
