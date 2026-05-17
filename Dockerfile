# Build stage
FROM gradle:8.5-jdk21 AS build
WORKDIR /app

# Copy gradle files
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY gradlew ./

# ✅ Make gradlew executable
RUN chmod +x gradlew

# Copy source code
COPY src ./src

# Build the application
RUN ./gradlew build -x test

# Runtime stage - Use Eclipse Temurin
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built JAR file
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8085

# Run the application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=render", "app.jar"]