package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.DriverManager;
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
@CrossOrigin
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

            
            String insertSql =
                "INSERT INTO ProjectScores (project_id, barangay, score) VALUES (?, ?, ?)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setInt(1, req.getProjectId());
            insertStmt.setString(2, req.getBarangay());
            insertStmt.setInt(3, req.getScore());
            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    
    @GetMapping("/getProjectScore")
    public String getProjectScore(@RequestParam int projectId) {
        try (Connection conn = dataSource.getConnection()) {

            
            String avgSql =
                "SELECT AVG(score) as average, COUNT(*) as total FROM ProjectScores WHERE project_id = ?";
            PreparedStatement avgStmt = conn.prepareStatement(avgSql);
            avgStmt.setInt(1, projectId);
            ResultSet avgRs = avgStmt.executeQuery();

            double average    = 0;
            int    totalVotes = 0;
            if (avgRs.next()) {
                average    = avgRs.getDouble("average");
                totalVotes = avgRs.getInt("total");
            }

            
            String breakSql =
                "SELECT score, COUNT(*) as cnt FROM ProjectScores WHERE project_id = ? GROUP BY score";
            PreparedStatement breakStmt = conn.prepareStatement(breakSql);
            breakStmt.setInt(1, projectId);
            ResultSet breakRs = breakStmt.executeQuery();

            int[] breakdown = new int[6]; 
            while (breakRs.next()) {
                int s = breakRs.getInt("score");
                if (s >= 1 && s <= 5) breakdown[s] = breakRs.getInt("cnt");
            }

            return String.format(
                "{\"average\":%.1f,\"totalVotes\":%d," +
                "\"breakdown\":{\"1\":%d,\"2\":%d,\"3\":%d,\"4\":%d,\"5\":%d}}",
                average, totalVotes,
                breakdown[1], breakdown[2], breakdown[3], breakdown[4], breakdown[5]
            );

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    
    @GetMapping("/getAllProjectScores")
    public String getAllProjectScores(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {

            String sql =
                "SELECT project_id, AVG(score) as average, COUNT(*) as total " +
                "FROM ProjectScores WHERE barangay = ? GROUP BY project_id";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("{");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                result.append("\"").append(rs.getInt("project_id")).append("\":{")
                      .append("\"average\":").append(String.format("%.1f", rs.getDouble("average"))).append(",")
                      .append("\"totalVotes\":").append(rs.getInt("total"))
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