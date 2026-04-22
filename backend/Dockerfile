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

ENTRYPOINT ["sh", "-c", "\
  java -Djavax.net.ssl.trustStore=/app/truststore.jks \
       -Djavax.net.ssl.trustStorePassword=changeit \
       -Dspring.security.oauth2.client.registration.google.client-id=${GOOGLE_CLIENT_ID} \
       -Dspring.security.oauth2.client.registration.google.client-secret=${GOOGLE_CLIENT_SECRET} \
       -jar app.jar"]
