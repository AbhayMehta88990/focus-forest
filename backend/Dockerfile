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

# Import Aiven CA certificate into Java truststore
COPY ca.pem /app/ca.pem
RUN keytool -importcert -alias aiven-ca -file /app/ca.pem \
    -keystore /app/truststore.jks -storepass changeit -noprompt

EXPOSE 3001

# Use a startup script to properly handle env vars with special characters
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "=== OAUTH DEBUG ==="' >> /app/start.sh && \
    echo 'echo "GOOGLE_CLIENT_ID length=${#GOOGLE_CLIENT_ID}"' >> /app/start.sh && \
    echo 'echo "GOOGLE_CLIENT_SECRET length=${#GOOGLE_CLIENT_SECRET}"' >> /app/start.sh && \
    echo 'echo "GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}"' >> /app/start.sh && \
    echo 'echo "==================="' >> /app/start.sh && \
    echo 'exec java \' >> /app/start.sh && \
    echo '  -Djavax.net.ssl.trustStore=/app/truststore.jks \' >> /app/start.sh && \
    echo '  -Djavax.net.ssl.trustStorePassword=changeit \' >> /app/start.sh && \
    echo '  -Dspring.security.oauth2.client.registration.google.client-id="${GOOGLE_CLIENT_ID}" \' >> /app/start.sh && \
    echo '  -Dspring.security.oauth2.client.registration.google.client-secret="${GOOGLE_CLIENT_SECRET}" \' >> /app/start.sh && \
    echo '  -jar app.jar' >> /app/start.sh && \
    chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
