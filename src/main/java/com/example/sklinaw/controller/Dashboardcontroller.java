package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
    "http://localhost:8085",
    "https://pitcherlike-unformalistic-armandina.ngrok-free.dev"
}, allowCredentials = "true")
public class Dashboardcontroller {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    /**
     * Get dashboard statistics for chairman
     * GET /api/getDashboardStats?barangay=Lahug
     */
    @GetMapping("/getDashboardStats")
    public String getDashboardStats(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT " +
                         "COUNT(*) as total_projects, " +
                         "SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_projects, " +
                         "SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_projects, " +
                         "SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_projects, " +
                         "COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN total_cost ELSE 0 END), 0) as total_approved_cost " +
                         "FROM Projects WHERE barangay = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder();
            if (rs.next()) {
                result.append("{")
                      .append("\"totalProjects\":").append(rs.getInt("total_projects")).append(",")
                      .append("\"pendingProjects\":").append(rs.getInt("pending_projects")).append(",")
                      .append("\"approvedProjects\":").append(rs.getInt("approved_projects")).append(",")
                      .append("\"rejectedProjects\":").append(rs.getInt("rejected_projects")).append(",")
                      .append("\"totalApprovedCost\":").append(rs.getDouble("total_approved_cost"))
                      .append("}");
            } else {
                result.append("{\"totalProjects\":0,\"pendingProjects\":0,\"approvedProjects\":0,\"rejectedProjects\":0,\"totalApprovedCost\":0}");
            }
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    /**
     * Get all projects with committee details (for chairman dashboard table)
     * GET /api/getAllProjectsWithCommittees?barangay=Lahug
     */
    @GetMapping("/getAllProjectsWithCommittees")
    public String getAllProjectsWithCommittees(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT c.name as committee_name, c.head_name, " +
                         "COUNT(p.id) as total_projects, " +
                         "SUM(CASE WHEN p.status = 'PENDING' THEN 1 ELSE 0 END) as pending_count, " +
                         "SUM(CASE WHEN p.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count, " +
                         "SUM(CASE WHEN p.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count, " +
                         "COALESCE(SUM(CASE WHEN p.status = 'APPROVED' THEN p.total_cost ELSE 0 END), 0) as total_spent " +
                         "FROM Committees c " +
                         "LEFT JOIN Projects p ON p.committee_name = c.name AND p.barangay = c.barangay " +
                         "WHERE c.barangay = ? " +
                         "GROUP BY c.name, c.head_name";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"headName\":\"").append(escape(rs.getString("head_name") != null ? rs.getString("head_name") : "")).append("\",")
                      .append("\"totalProjects\":").append(rs.getInt("total_projects")).append(",")
                      .append("\"pendingCount\":").append(rs.getInt("pending_count")).append(",")
                      .append("\"approvedCount\":").append(rs.getInt("approved_count")).append(",")
                      .append("\"rejectedCount\":").append(rs.getInt("rejected_count")).append(",")
                      .append("\"totalSpent\":").append(rs.getDouble("total_spent"))
                      .append("},");
            }
            if (result.length() > 1) result.setLength(result.length() - 1);
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
}