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
@CrossOrigin
public class FeedbackController {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    // ─────────────────────────────────────────────────────────────────
    // GENERAL BARANGAY FEEDBACK
    // ─────────────────────────────────────────────────────────────────

    /**
     * Submit general feedback about the barangay SK.
     * Body: { "barangay": "Lahug", "authorName": "Anonymous", "message": "Great job!", "reaction": "like" }
     */
    @PostMapping("/submitFeedback")
    public String submitFeedback(@RequestBody FeedbackRequest req) {
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return "EMPTY_MESSAGE";
        }
        if (req.getMessage().trim().length() > 500) {
            return "MESSAGE_TOO_LONG";
        }
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "INSERT INTO Feedback (barangay, author_name, message, reaction) VALUES (?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, req.getBarangay());
            stmt.setString(2, req.getAuthorName() != null && !req.getAuthorName().trim().isEmpty()
                              ? req.getAuthorName().trim() : "Anonymous");
            stmt.setString(3, req.getMessage().trim());
            stmt.setString(4, req.getReaction());
            stmt.executeUpdate();
            return "SUCCESS";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    /**
     * Get all general feedback for a barangay, newest first.
     * GET /api/getFeedback?barangay=Lahug
     */
    @GetMapping("/getFeedback")
    public String getFeedback(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT id, author_name, message, reaction, created_at " +
                         "FROM Feedback WHERE barangay = ? ORDER BY created_at DESC LIMIT 100";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"authorName\":\"").append(escape(rs.getString("author_name"))).append("\",")
                      .append("\"message\":\"").append(escape(rs.getString("message"))).append("\",")
                      .append("\"reaction\":\"").append(escape(rs.getString("reaction") != null ? rs.getString("reaction") : "")).append("\",")
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

    // ─────────────────────────────────────────────────────────────────
    // PROJECT-SPECIFIC COMMENTS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Submit a comment on a specific project.
     * Body: { "projectId": 1, "barangay": "Lahug", "authorName": "", "message": "Nice!", "reaction": "clap" }
     */
    @PostMapping("/submitProjectComment")
    public String submitProjectComment(@RequestBody ProjectCommentRequest req) {
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return "EMPTY_MESSAGE";
        }
        if (req.getMessage().trim().length() > 500) {
            return "MESSAGE_TOO_LONG";
        }
        try (Connection conn = DriverManager.getConnection(URL)) {

            // Insert comment
            String sql = "INSERT INTO ProjectComments (project_id, barangay, author_name, message, reaction) " +
                         "VALUES (?, ?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, req.getProjectId());
            stmt.setString(2, req.getBarangay());
            stmt.setString(3, req.getAuthorName() != null && !req.getAuthorName().trim().isEmpty()
                              ? req.getAuthorName().trim() : "Anonymous");
            stmt.setString(4, req.getMessage().trim());
            stmt.setString(5, req.getReaction());
            stmt.executeUpdate();

            // Update reaction count if a reaction was included
            if (req.getReaction() != null && !req.getReaction().trim().isEmpty()) {
                String upsertSql = "INSERT INTO ProjectReactions (project_id, barangay, reaction, count) " +
                                   "VALUES (?, ?, ?, 1) " +
                                   "ON CONFLICT(project_id, reaction) DO UPDATE SET count = count + 1";
                PreparedStatement upsert = conn.prepareStatement(upsertSql);
                upsert.setInt(1, req.getProjectId());
                upsert.setString(2, req.getBarangay());
                upsert.setString(3, req.getReaction());
                upsert.executeUpdate();
            }

            return "SUCCESS";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    /**
     * Get all comments for a specific project.
     * GET /api/getProjectComments?projectId=1
     */
    @GetMapping("/getProjectComments")
    public String getProjectComments(@RequestParam int projectId) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT id, author_name, message, reaction, created_at " +
                         "FROM ProjectComments WHERE project_id = ? ORDER BY created_at DESC LIMIT 50";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"authorName\":\"").append(escape(rs.getString("author_name"))).append("\",")
                      .append("\"message\":\"").append(escape(rs.getString("message"))).append("\",")
                      .append("\"reaction\":\"").append(escape(rs.getString("reaction") != null ? rs.getString("reaction") : "")).append("\",")
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

    /**
     * Get reaction counts for a project.
     * GET /api/getProjectReactions?projectId=1
     */
    @GetMapping("/getProjectReactions")
    public String getProjectReactions(@RequestParam int projectId) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT reaction, count FROM ProjectReactions WHERE project_id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("{");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("\"").append(escape(rs.getString("reaction"))).append("\":")
                      .append(rs.getInt("count"));
                first = false;
            }
            result.append("}");
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

    // ── Inner request classes ──────────────────────────────────────────

    public static class FeedbackRequest {
        private String barangay;
        private String authorName;
        private String message;
        private String reaction;

        public String getBarangay()   { return barangay; }
        public String getAuthorName() { return authorName; }
        public String getMessage()    { return message; }
        public String getReaction()   { return reaction; }

        public void setBarangay(String v)   { this.barangay = v; }
        public void setAuthorName(String v) { this.authorName = v; }
        public void setMessage(String v)    { this.message = v; }
        public void setReaction(String v)   { this.reaction = v; }
    }

    public static class ProjectCommentRequest {
        private int    projectId;
        private String barangay;
        private String authorName;
        private String message;
        private String reaction;

        public int    getProjectId()  { return projectId; }
        public String getBarangay()   { return barangay; }
        public String getAuthorName() { return authorName; }
        public String getMessage()    { return message; }
        public String getReaction()   { return reaction; }

        public void setProjectId(int v)     { this.projectId = v; }
        public void setBarangay(String v)   { this.barangay = v; }
        public void setAuthorName(String v) { this.authorName = v; }
        public void setMessage(String v)    { this.message = v; }
        public void setReaction(String v)   { this.reaction = v; }
    }
}