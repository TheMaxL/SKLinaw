# Build stage: Uses a Maven image with JDK 21 to compile your code
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
# Copy the project files and build the application
COPY . .
RUN ./gradlew clean bootJar -x test

# Production stage: Uses a slim JDK 21 image to run the app
FROM openjdk:21-jdk-slim
WORKDIR /app
# Copy the built JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# The port your application runs on
EXPOSE 8085

# The command to run your application
ENTRYPOINT ["java", "-jar", "app.jar"]