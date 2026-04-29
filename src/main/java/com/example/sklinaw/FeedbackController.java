package com.example.sklinaw;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class FeedbackController {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    // Submit feedback for a specific project
    @PostMapping("/submitProjectComment")
    public String submitProjectComment(@RequestBody ProjectCommentRequest req) {
        System.out.println("=== submitProjectComment called ===");
        System.out.println("Project ID: " + req.getProjectId());
        System.out.println("Barangay: " + req.getBarangay());
        System.out.println("Author: " + req.getAuthorName());
        System.out.println("Message: " + req.getMessage());
        System.out.println("Rating: " + req.getRating());
        
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return "EMPTY_MESSAGE";
        }
        if (req.getMessage().trim().length() > 500) {
            return "MESSAGE_TOO_LONG";
        }
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "INSERT INTO Feedback (barangay, project_id, name, message, rating, created_at) " +
                         "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, req.getBarangay());
            stmt.setInt(2, req.getProjectId());
            stmt.setString(3, req.getAuthorName() != null && !req.getAuthorName().trim().isEmpty()
                              ? req.getAuthorName().trim() : "Anonymous");
            stmt.setString(4, req.getMessage().trim());
            stmt.setInt(5, req.getRating());
            
            int rows = stmt.executeUpdate();
            System.out.println("Inserted " + rows + " row(s) into Feedback table");
            
            return "SUCCESS";
            
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Error in submitProjectComment: " + e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    // Get comments for a specific project
    @GetMapping("/getProjectComments")
    public String getProjectComments(@RequestParam int projectId) {
        System.out.println("=== getProjectComments called for projectId: " + projectId);
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT id, name, message, rating, created_at " +
                         "FROM Feedback WHERE project_id = ? ORDER BY created_at DESC LIMIT 50";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"authorName\":\"").append(escape(rs.getString("name"))).append("\",")
                      .append("\"message\":\"").append(escape(rs.getString("message"))).append("\",")
                      .append("\"rating\":").append(rs.getInt("rating")).append(",")
                      .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\"")
                      .append("}");
                first = false;
            }
            result.append("]");
            return result.toString();
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    // Submit general feedback (for barangay, not specific project)
    @PostMapping("/submitFeedback")
    public String submitFeedback(@RequestBody FeedbackRequest req) {
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return "EMPTY_MESSAGE";
        }
        if (req.getMessage().trim().length() > 500) {
            return "MESSAGE_TOO_LONG";
        }
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "INSERT INTO Feedback (barangay, name, message, rating, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, req.getBarangay());
            stmt.setString(2, req.getAuthorName() != null && !req.getAuthorName().trim().isEmpty()
                              ? req.getAuthorName().trim() : "Anonymous");
            stmt.setString(3, req.getMessage().trim());
            stmt.setInt(4, 0);
            stmt.executeUpdate();
            return "SUCCESS";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    // Get general feedback for a barangay
    @GetMapping("/getFeedback")
    public String getFeedback(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT id, name, message, rating, created_at " +
                         "FROM Feedback WHERE barangay = ? AND (project_id IS NULL OR project_id = 0) ORDER BY created_at DESC LIMIT 100";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"authorName\":\"").append(escape(rs.getString("name"))).append("\",")
                      .append("\"message\":\"").append(escape(rs.getString("message"))).append("\",")
                      .append("\"rating\":").append(rs.getInt("rating")).append(",")
                      .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\"")
                      .append("}");
                first = false;
            }
            result.append("]");
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // Inner request classes
    public static class FeedbackRequest {
        private String barangay;
        private String authorName;
        private String message;
        private String reaction;

        public String getBarangay() { return barangay; }
        public String getAuthorName() { return authorName; }
        public String getMessage() { return message; }
        public String getReaction() { return reaction; }

        public void setBarangay(String v) { this.barangay = v; }
        public void setAuthorName(String v) { this.authorName = v; }
        public void setMessage(String v) { this.message = v; }
        public void setReaction(String v) { this.reaction = v; }
    }

    public static class ProjectCommentRequest {
        private int projectId;
        private String barangay;
        private String authorName;
        private String message;
        private int rating;
        private String reaction;

        // Getters
        public int getProjectId() { return projectId; }
        public String getBarangay() { return barangay; }
        public String getAuthorName() { return authorName; }
        public String getMessage() { return message; }
        public int getRating() { return rating; }
        public String getReaction() { return reaction; }

        // Setters
        public void setProjectId(int projectId) { this.projectId = projectId; }
        public void setBarangay(String barangay) { this.barangay = barangay; }
        public void setAuthorName(String authorName) { this.authorName = authorName; }
        public void setMessage(String message) { this.message = message; }
        public void setRating(int rating) { this.rating = rating; }
        public void setReaction(String reaction) { this.reaction = reaction; }
    }
}