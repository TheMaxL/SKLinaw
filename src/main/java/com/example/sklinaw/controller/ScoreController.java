package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
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
    "http://localhost:3000",
    "https://sklinaw.vercel.app",
    "https://*.vercel.app",
    "https://sklinaw.onrender.com",
    "https://*.onrender.com"
}, allowCredentials = "true")
public class ScoreController {
    @Autowired
    private DataSource dataSource;
    
    @Value("${spring.datasource.url}")
    private String dbUrl;
    
    @PostMapping("/submitScore")
    public String submitScore(@RequestBody ScoreRequest req) {
        if (req.getScore() < 1 || req.getScore() > 5) {
            return "INVALID_SCORE";
        }

        try (Connection conn = dataSource.getConnection()) {
            String checkSql = "SELECT id FROM Projects WHERE id = ? AND barangay = ? AND status = 'APPROVED'";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, req.getProjectId());
            checkStmt.setString(2, req.getBarangay());
            ResultSet rs = checkStmt.executeQuery();
            if (!rs.next()) return "PROJECT_NOT_FOUND";

            // Insert into ProjectRatings table (or update if exists)
            String upsertSql = "INSERT INTO ProjectRatings (project_id, barangay, rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count, total_ratings, average_rating, updated_at) " +
                               "VALUES (?, ?, " +
                               "CASE WHEN ? = 1 THEN 1 ELSE 0 END, " +
                               "CASE WHEN ? = 2 THEN 1 ELSE 0 END, " +
                               "CASE WHEN ? = 3 THEN 1 ELSE 0 END, " +
                               "CASE WHEN ? = 4 THEN 1 ELSE 0 END, " +
                               "CASE WHEN ? = 5 THEN 1 ELSE 0 END, " +
                               "1, ?, CURRENT_TIMESTAMP) " +
                               "ON CONFLICT(project_id) DO UPDATE SET " +
                               "rating_1_count = rating_1_count + (CASE WHEN ? = 1 THEN 1 ELSE 0 END), " +
                               "rating_2_count = rating_2_count + (CASE WHEN ? = 2 THEN 1 ELSE 0 END), " +
                               "rating_3_count = rating_3_count + (CASE WHEN ? = 3 THEN 1 ELSE 0 END), " +
                               "rating_4_count = rating_4_count + (CASE WHEN ? = 4 THEN 1 ELSE 0 END), " +
                               "rating_5_count = rating_5_count + (CASE WHEN ? = 5 THEN 1 ELSE 0 END), " +
                               "total_ratings = total_ratings + 1, " +
                               "average_rating = (rating_1_count + rating_2_count*2 + rating_3_count*3 + rating_4_count*4 + rating_5_count*5 + ?) / (total_ratings + 1.0), " +
                               "updated_at = CURRENT_TIMESTAMP";
            
            PreparedStatement upsertStmt = conn.prepareStatement(upsertSql);
            int score = req.getScore();
            upsertStmt.setInt(1, req.getProjectId());
            upsertStmt.setString(2, req.getBarangay());
            upsertStmt.setInt(3, score);
            upsertStmt.setInt(4, score);
            upsertStmt.setInt(5, score);
            upsertStmt.setInt(6, score);
            upsertStmt.setInt(7, score);
            upsertStmt.setDouble(8, score);
            upsertStmt.setInt(9, score);
            upsertStmt.setInt(10, score);
            upsertStmt.setInt(11, score);
            upsertStmt.setInt(12, score);
            upsertStmt.setInt(13, score);
            upsertStmt.setInt(14, score);
            upsertStmt.setDouble(15, score);
            
            upsertStmt.executeUpdate();
            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getProjectScore")
    public String getProjectScore(@RequestParam int projectId) {
        try (Connection conn = dataSource.getConnection()) {
            // Query from ProjectRatings table
            String sql = "SELECT average_rating, total_ratings, " +
                         "rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count " +
                         "FROM ProjectRatings WHERE project_id = ?";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                double average = rs.getDouble("average_rating");
                int totalVotes = rs.getInt("total_ratings");
                int r1 = rs.getInt("rating_1_count");
                int r2 = rs.getInt("rating_2_count");
                int r3 = rs.getInt("rating_3_count");
                int r4 = rs.getInt("rating_4_count");
                int r5 = rs.getInt("rating_5_count");
                
                return String.format(
                    "{\"average\":%.1f,\"totalVotes\":%d,\"breakdown\":{\"1\":%d,\"2\":%d,\"3\":%d,\"4\":%d,\"5\":%d}}",
                    average, totalVotes, r1, r2, r3, r4, r5
                );
            }
            
            return "{\"average\":0,\"totalVotes\":0,\"breakdown\":{\"1\":0,\"2\":0,\"3\":0,\"4\":0,\"5\":0}}";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getAllProjectScores")
    public String getAllProjectScores(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT project_id, average_rating, total_ratings " +
                         "FROM ProjectRatings WHERE barangay = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("{");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("\"").append(rs.getInt("project_id")).append("\":{")
                      .append("\"average\":").append(String.format("%.1f", rs.getDouble("average_rating"))).append(",")
                      .append("\"totalVotes\":").append(rs.getInt("total_ratings"))
                      .append("}");
                first = false;
            }
            result.append("}");
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    public static class ScoreRequest {
        private int    projectId;
        private String barangay;
        private int    score;

        public int    getProjectId() { return projectId; }
        public String getBarangay()  { return barangay; }
        public int    getScore()     { return score; }

        public void setProjectId(int v)    { this.projectId = v; }
        public void setBarangay(String v)  { this.barangay = v; }
        public void setScore(int v)        { this.score = v; }
    }
}