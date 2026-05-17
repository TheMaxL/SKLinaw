package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
    "http://localhost:8085",
    "https://pitcherlike-unformalistic-armandina.ngrok-free.dev"
}, allowCredentials = "true")
public class FeedbackController {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    // Submit comment for a specific project (no rating - rating goes to ScoreController)
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
        
        try (Connection conn = DriverManager.getConnection(dbUrl)) {
            // Insert comment with rating
            String sql = "INSERT INTO Feedback (barangay, project_id, name, message, rating, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, req.getBarangay());
            stmt.setInt(2, req.getProjectId());
            stmt.setString(3, req.getAuthorName() != null && !req.getAuthorName().trim().isEmpty()
                            ? req.getAuthorName().trim() : "Anonymous");
            stmt.setString(4, req.getMessage().trim());
            stmt.setInt(5, req.getRating()); // Store rating in Feedback table
            
            int rows = stmt.executeUpdate();
            System.out.println("Inserted " + rows + " row(s) into Feedback table");
            
            // Update the project rating summary
            updateProjectRating(req.getProjectId(), req.getBarangay());
            
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
        
        try (Connection conn = DriverManager.getConnection(dbUrl)) {
            String sql = "SELECT id, name, message, created_at " +
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

    @GetMapping("/public/getBarangays")
    public String getPublicBarangays() {
        try (Connection conn = DriverManager.getConnection(dbUrl)) {
            String sql = "SELECT DISTINCT Barangay as barangay FROM Councilors WHERE approved = 1";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("\"").append(escape(rs.getString("barangay"))).append("\"");
                first = false;
            }
            result.append("]");
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "[]";
        }
    }

    @GetMapping("/getProjectRating")
    public String getProjectRating(@RequestParam int projectId) {
        try (Connection conn = DriverManager.getConnection(dbUrl)) {
            String sql = "SELECT AVG(rating) as average, COUNT(*) as total, " +
                        "SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as r1, " +
                        "SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as r2, " +
                        "SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as r3, " +
                        "SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as r4, " +
                        "SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as r5 " +
                        "FROM Feedback WHERE project_id = ? AND rating > 0";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                return String.format(
                    "{\"average\":%.1f,\"totalVotes\":%d,\"breakdown\":{\"1\":%d,\"2\":%d,\"3\":%d,\"4\":%d,\"5\":%d}}",
                    rs.getDouble("average"),
                    rs.getInt("total"),
                    rs.getInt("r1"), rs.getInt("r2"), rs.getInt("r3"), rs.getInt("r4"), rs.getInt("r5")
                );
            }
            return "{\"average\":0,\"totalVotes\":0,\"breakdown\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}}";
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

    private void updateProjectRating(int projectId, String barangay) {
        try (Connection conn = DriverManager.getConnection(dbUrl)) {
            // Calculate averages from Feedback table
            String calcSql = "SELECT " +
                            "COUNT(*) as total_ratings, " +
                            "AVG(rating) as avg_rating, " +
                            "SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as r1, " +
                            "SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as r2, " +
                            "SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as r3, " +
                            "SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as r4, " +
                            "SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as r5 " +
                            "FROM Feedback WHERE project_id = ? AND rating > 0";
            PreparedStatement calcStmt = conn.prepareStatement(calcSql);
            calcStmt.setInt(1, projectId);
            ResultSet rs = calcStmt.executeQuery();
            
            if (rs.next()) {
                String upsertSql = "INSERT OR REPLACE INTO ProjectRatings " +
                                "(project_id, barangay, average_rating, total_ratings, " +
                                "rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, updated_at) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)";
                PreparedStatement upsertStmt = conn.prepareStatement(upsertSql);
                upsertStmt.setInt(1, projectId);
                upsertStmt.setString(2, barangay);
                upsertStmt.setDouble(3, rs.getDouble("avg_rating"));
                upsertStmt.setInt(4, rs.getInt("total_ratings"));
                upsertStmt.setInt(5, rs.getInt("r1"));
                upsertStmt.setInt(6, rs.getInt("r2"));
                upsertStmt.setInt(7, rs.getInt("r3"));
                upsertStmt.setInt(8, rs.getInt("r4"));
                upsertStmt.setInt(9, rs.getInt("r5"));
                upsertStmt.executeUpdate();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Inner request class
    public static class ProjectCommentRequest {
        private int projectId;
        private String barangay;
        private String authorName;
        private String message;
        private int rating;  // kept for compatibility but not used
        private String reaction;

        public int getProjectId() { return projectId; }
        public String getBarangay() { return barangay; }
        public String getAuthorName() { return authorName; }
        public String getMessage() { return message; }
        public int getRating() { return rating; }
        public String getReaction() { return reaction; }

        public void setProjectId(int projectId) { this.projectId = projectId; }
        public void setBarangay(String barangay) { this.barangay = barangay; }
        public void setAuthorName(String authorName) { this.authorName = authorName; }
        public void setMessage(String message) { this.message = message; }
        public void setRating(int rating) { this.rating = rating; }
        public void setReaction(String reaction) { this.reaction = reaction; }
    }
}