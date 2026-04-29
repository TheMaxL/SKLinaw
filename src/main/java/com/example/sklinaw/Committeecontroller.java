package com.example.sklinaw;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

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
public class Committeecontroller {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    @PostMapping("/createCommittee")
    public String createCommittee(@RequestBody CommitteeMember committee) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // Check committee doesn't already exist
            String checkSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setString(1, committee.getCommitteeName());
            checkStmt.setString(2, committee.getBarangay());
            ResultSet rs = checkStmt.executeQuery();

            if (rs.next()) {
                return "COMMITTEE_ALREADY_EXISTS";
            }

            // If headName is provided, validate they belong to the barangay
            if (committee.getHeadName() != null && !committee.getHeadName().trim().isEmpty()) {
                String verifyHeadSql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
                PreparedStatement verifyHeadStmt = conn.prepareStatement(verifyHeadSql);
                verifyHeadStmt.setString(1, committee.getHeadName());
                verifyHeadStmt.setString(2, committee.getBarangay());
                ResultSet headRs = verifyHeadStmt.executeQuery();
                
                if (!headRs.next()) {
                    return "COUNCILOR_NOT_IN_BARANGAY";
                }
                
                // Check if councilor already heads another committee
                String headCheckSql = "SELECT * FROM Committees WHERE head_name = ? AND barangay = ?";
                PreparedStatement headCheckStmt = conn.prepareStatement(headCheckSql);
                headCheckStmt.setString(1, committee.getHeadName());
                headCheckStmt.setString(2, committee.getBarangay());
                ResultSet existingHeadRs = headCheckStmt.executeQuery();
                
                if (existingHeadRs.next()) {
                    return "ALREADY_HEADS_A_COMMITTEE";
                }
            }

            // Insert new committee
            String insertSql = "INSERT INTO Committees (name, barangay, head_name) VALUES (?, ?, ?)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setString(1, committee.getCommitteeName());
            insertStmt.setString(2, committee.getBarangay());
            insertStmt.setString(3, committee.getHeadName() != null ? committee.getHeadName() : "");
            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/assignCommitteeHead")
    public String assignCommitteeHead(@RequestBody CommitteeMember committee) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1. Check if committee exists in the barangay
            String committeeCheckSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement committeeCheckStmt = conn.prepareStatement(committeeCheckSql);
            committeeCheckStmt.setString(1, committee.getCommitteeName());
            committeeCheckStmt.setString(2, committee.getBarangay());
            ResultSet committeeRs = committeeCheckStmt.executeQuery();

            if (!committeeRs.next()) {
                return "COMMITTEE_NOT_FOUND";
            }

            // 2. Check councilor exists, is approved, and is in the SAME barangay
            String verifySql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
            verifyStmt.setString(1, committee.getHeadName());
            verifyStmt.setString(2, committee.getBarangay());
            ResultSet rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "COUNCILOR_NOT_IN_BARANGAY";
            }

            // 3. Check councilor is not already heading another committee in the same barangay
            String headCheckSql = "SELECT * FROM Committees WHERE head_name = ? AND barangay = ? AND name != ?";
            PreparedStatement headCheckStmt = conn.prepareStatement(headCheckSql);
            headCheckStmt.setString(1, committee.getHeadName());
            headCheckStmt.setString(2, committee.getBarangay());
            headCheckStmt.setString(3, committee.getCommitteeName());
            ResultSet headRs = headCheckStmt.executeQuery();

            if (headRs.next()) {
                return "ALREADY_HEADS_A_COMMITTEE";
            }

            // 4. Assign as head
            String updateSql = "UPDATE Committees SET head_name = ? WHERE name = ? AND barangay = ?";
            PreparedStatement updateStmt = conn.prepareStatement(updateSql);
            updateStmt.setString(1, committee.getHeadName());
            updateStmt.setString(2, committee.getCommitteeName());
            updateStmt.setString(3, committee.getBarangay());
            int rows = updateStmt.executeUpdate();

            if (rows == 0) {
                return "COMMITTEE_NOT_FOUND";
            }

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/addCommitteeMember")
    public String addCommitteeMember(@RequestBody CommitteeMember member) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1. Check if committee exists in the barangay
            String committeeCheckSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement committeeCheckStmt = conn.prepareStatement(committeeCheckSql);
            committeeCheckStmt.setString(1, member.getCommitteeName());
            committeeCheckStmt.setString(2, member.getBarangay());
            ResultSet committeeRs = committeeCheckStmt.executeQuery();

            if (!committeeRs.next()) {
                return "COMMITTEE_NOT_FOUND";
            }

            // 2. Check councilor exists, is approved, and is in the SAME barangay
            String verifySql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
            verifyStmt.setString(1, member.getCouncilorName());
            verifyStmt.setString(2, member.getBarangay());
            ResultSet rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "COUNCILOR_NOT_IN_BARANGAY";
            }

            // 3. Check if councilor is already a member of this committee
            String memberCheckSql = "SELECT * FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? AND councilor_name = ?";
            PreparedStatement memberCheckStmt = conn.prepareStatement(memberCheckSql);
            memberCheckStmt.setString(1, member.getCommitteeName());
            memberCheckStmt.setString(2, member.getBarangay());
            memberCheckStmt.setString(3, member.getCouncilorName());
            ResultSet memberRs = memberCheckStmt.executeQuery();

            if (memberRs.next()) {
                return "ALREADY_A_MEMBER";
            }

            // 4. Add councilor as committee member
            String insertSql = "INSERT INTO CommitteeMembers (committee_name, barangay, councilor_name, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setString(1, member.getCommitteeName());
            insertStmt.setString(2, member.getBarangay());
            insertStmt.setString(3, member.getCouncilorName());
            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/removeCommitteeMember")
    public String removeCommitteeMember(@RequestBody CommitteeMember member) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // Check if the councilor is the head - heads cannot be removed as members
            String headCheckSql = "SELECT head_name FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement headCheckStmt = conn.prepareStatement(headCheckSql);
            headCheckStmt.setString(1, member.getCommitteeName());
            headCheckStmt.setString(2, member.getBarangay());
            ResultSet headRs = headCheckStmt.executeQuery();
            
            if (headRs.next()) {
                String headName = headRs.getString("head_name");
                if (member.getCouncilorName().equals(headName)) {
                    return "CANNOT_REMOVE_COMMITTEE_HEAD";
                }
            }

            // Remove member
            String deleteSql = "DELETE FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? AND councilor_name = ?";
            PreparedStatement deleteStmt = conn.prepareStatement(deleteSql);
            deleteStmt.setString(1, member.getCommitteeName());
            deleteStmt.setString(2, member.getBarangay());
            deleteStmt.setString(3, member.getCouncilorName());
            int rows = deleteStmt.executeUpdate();

            if (rows == 0) {
                return "MEMBER_NOT_FOUND";
            }

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    /**
     * Gets all members of a committee.
     *
     * Example: GET /api/getCommitteeMembers?barangay=Lahug&committeeName=Sports
     */
    @GetMapping("/getCommitteeMembers")
    public String getCommitteeMembers(@RequestParam String barangay, @RequestParam String committeeName) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // Get committee head first
            String headSql = "SELECT head_name FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement headStmt = conn.prepareStatement(headSql);
            headStmt.setString(1, committeeName);
            headStmt.setString(2, barangay);
            ResultSet headRs = headStmt.executeQuery();
            
            String headName = "";
            if (headRs.next() && headRs.getString("head_name") != null) {
                headName = headRs.getString("head_name");
            }

            // Get all members
            String sql = "SELECT councilor_name, joined_at FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? ORDER BY joined_at";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, committeeName);
            stmt.setString(2, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("{\"head\":\"").append(headName).append("\",\"members\":[");
            
            while (rs.next()) {
                result.append("{")
                      .append("\"name\":\"").append(rs.getString("councilor_name")).append("\",")
                      .append("\"joinedAt\":\"").append(rs.getString("joined_at")).append("\"")
                      .append("},");
            }
            
            if (result.charAt(result.length() - 1) == ',') {
                result.setLength(result.length() - 1);
            }
            
            result.append("]}");
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getCommittees")
    public String getCommittees(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql = "SELECT name, head_name FROM Committees WHERE barangay = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{\"committeeName\":\"").append(rs.getString("name")).append("\",");
                result.append("\"headName\":\"").append(rs.getString("head_name") != null ? rs.getString("head_name") : "").append("\"},");
            }
            // Remove trailing comma and close array
            if (result.length() > 1) result.setLength(result.length() - 1);
            result.append("]");

            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/addProject")
    public String addProject(@RequestBody Projectcontroller project) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1. Check councilor is registered, approved, and in the SAME barangay
            String verifySql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
            verifyStmt.setString(1, project.getCouncilorName());
            verifyStmt.setString(2, project.getBarangay());
            ResultSet rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "COUNCILOR_NOT_IN_BARANGAY";
            }

            // 2. Check that the committee exists in the same barangay
            String committeeSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement committeeStmt = conn.prepareStatement(committeeSql);
            committeeStmt.setString(1, project.getCommitteeName());
            committeeStmt.setString(2, project.getBarangay());
            ResultSet committeeRs = committeeStmt.executeQuery();

            if (!committeeRs.next()) {
                return "COMMITTEE_NOT_FOUND";
            }

            // 3. Insert project with status PENDING (awaiting chairman approval)
            String insertSql = "INSERT INTO Projects (project_name, purpose, committee_name, barangay, councilor_name, total_cost, status) " +
                               "VALUES (?, ?, ?, ?, ?, ?, 'PENDING')";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setString(1, project.getProjectName());
            insertStmt.setString(2, project.getPurpose());
            insertStmt.setString(3, project.getCommitteeName());
            insertStmt.setString(4, project.getBarangay());
            insertStmt.setString(5, project.getCouncilorName());
            insertStmt.setDouble(6, project.getTotalCost());
            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getProjects")
    public String getProjects(@RequestParam String barangay, @RequestParam String committeeName) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql = "SELECT id, project_name, purpose, councilor_name, total_cost, status, created_at " +
                         "FROM Projects WHERE barangay = ? AND committee_name = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setString(2, committeeName);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"projectName\":\"").append(rs.getString("project_name")).append("\",")
                      .append("\"purpose\":\"").append(rs.getString("purpose")).append("\",")
                      .append("\"councilorName\":\"").append(rs.getString("councilor_name")).append("\",")
                      .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                      .append("\"status\":\"").append(rs.getString("status")).append("\",")
                      .append("\"createdAt\":\"").append(rs.getString("created_at")).append("\"")
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

    @GetMapping("/getPendingProjects")
    public String getPendingProjects(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            String sql = "SELECT p.id, p.project_name, p.purpose, p.committee_name, p.councilor_name, " +
                        "p.total_cost, p.status, p.created_at, c.head_name as committee_head " +
                        "FROM Projects p " +
                        "LEFT JOIN Committees c ON p.committee_name = c.name AND p.barangay = c.barangay " +
                        "WHERE p.barangay = ? AND p.status = 'PENDING' " +
                        "ORDER BY p.created_at DESC";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(rs.getString("project_name")).append("\",")
                    .append("\"purpose\":\"").append(rs.getString("purpose")).append("\",")
                    .append("\"committeeName\":\"").append(rs.getString("committee_name")).append("\",")
                    .append("\"councilorName\":\"").append(rs.getString("councilor_name")).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(rs.getString("status")).append("\",")
                    .append("\"createdAt\":\"").append(rs.getString("created_at")).append("\",")
                    .append("\"committeeHead\":\"").append(rs.getString("committee_head") != null ? rs.getString("committee_head") : "").append("\"")
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

    @GetMapping("/getAllProjects")
    public String getAllProjects(@RequestParam String barangay, @RequestParam(required = false) String status) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            String sql = "SELECT p.id, p.project_name, p.purpose, p.committee_name, p.councilor_name, " +
                        "p.total_cost, p.status, p.created_at, p.approved_at, " +
                        "c.head_name as committee_head " +
                        "FROM Projects p " +
                        "LEFT JOIN Committees c ON p.committee_name = c.name AND p.barangay = c.barangay " +
                        "WHERE p.barangay = ?";
            
            if (status != null && !status.isEmpty() && !status.equals("ALL")) {
                sql += " AND p.status = ?";
            }
            
            sql += " ORDER BY p.created_at DESC";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            
            if (status != null && !status.isEmpty() && !status.equals("ALL")) {
                stmt.setString(2, status);
            }
            
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(rs.getString("project_name")).append("\",")
                    .append("\"purpose\":\"").append(rs.getString("purpose")).append("\",")
                    .append("\"committeeName\":\"").append(rs.getString("committee_name")).append("\",")
                    .append("\"councilorName\":\"").append(rs.getString("councilor_name")).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(rs.getString("status")).append("\",")
                    .append("\"createdAt\":\"").append(rs.getString("created_at")).append("\",")
                    .append("\"approvedAt\":\"").append(rs.getString("approved_at") != null ? rs.getString("approved_at") : "").append("\",")
                    .append("\"committeeHead\":\"").append(rs.getString("committee_head") != null ? rs.getString("committee_head") : "").append("\"")
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

    @GetMapping("/getPublicProjects")
    public String getPublicProjects(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            String sql = "SELECT p.id, p.project_name, p.purpose, p.committee_name, p.councilor_name, " +
                        "p.total_cost, p.status, p.created_at, p.approved_at, p.approved_by, " +
                        "c.head_name as committee_head " +
                        "FROM Projects p " +
                        "LEFT JOIN Committees c ON p.committee_name = c.name AND p.barangay = c.barangay " +
                        "WHERE p.barangay = ? AND p.status = 'APPROVED' " +
                        "ORDER BY p.approved_at DESC";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(rs.getString("project_name")).append("\",")
                    .append("\"purpose\":\"").append(rs.getString("purpose")).append("\",")
                    .append("\"committeeName\":\"").append(rs.getString("committee_name")).append("\",")
                    .append("\"councilorName\":\"").append(rs.getString("councilor_name")).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(rs.getString("status")).append("\",")
                    .append("\"createdAt\":\"").append(rs.getString("created_at")).append("\",")
                    .append("\"approvedAt\":\"").append(rs.getString("approved_at")).append("\",")
                    .append("\"approvedBy\":\"").append(rs.getString("approved_by") != null ? rs.getString("approved_by") : "").append("\",")
                    .append("\"committeeHead\":\"").append(rs.getString("committee_head") != null ? rs.getString("committee_head") : "").append("\"")
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

    @GetMapping("/getCommitteeProjects")
    public String getCommitteeProjects(@RequestParam String barangay, @RequestParam String committeeName) {
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            String sql = "SELECT p.id, p.project_name, p.purpose, p.councilor_name, " +
                        "p.total_cost, p.status, p.created_at, p.approved_at, p.approved_by, p.rejection_reason " +
                        "FROM Projects p " +
                        "WHERE p.barangay = ? AND p.committee_name = ? " +
                        "ORDER BY p.created_at DESC";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setString(2, committeeName);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(rs.getString("project_name")).append("\",")
                    .append("\"purpose\":\"").append(rs.getString("purpose")).append("\",")
                    .append("\"councilorName\":\"").append(rs.getString("councilor_name")).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(rs.getString("status")).append("\",")
                    .append("\"createdAt\":\"").append(rs.getString("created_at")).append("\",")
                    .append("\"approvedAt\":\"").append(rs.getString("approved_at") != null ? rs.getString("approved_at") : "").append("\",")
                    .append("\"approvedBy\":\"").append(rs.getString("approved_by") != null ? rs.getString("approved_by") : "").append("\",")
                    .append("\"rejectionReason\":\"").append(rs.getString("rejection_reason") != null ? rs.getString("rejection_reason") : "").append("\"")
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

    @PostMapping("/approveProject")
    public String approveProject(@RequestBody Map<String, Object> request) {
        int projectId = (int) request.get("projectId");
        String barangay = (String) request.get("barangay");
        String approvedBy = (String) request.get("approvedBy");
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            // Start transaction
            conn.setAutoCommit(false);
            
            try {
                // 1. Get project details
                String getProjectSql = "SELECT committee_name, total_cost, status FROM Projects WHERE id = ? AND barangay = ?";
                PreparedStatement getProjectStmt = conn.prepareStatement(getProjectSql);
                getProjectStmt.setInt(1, projectId);
                getProjectStmt.setString(2, barangay);
                ResultSet projectRs = getProjectStmt.executeQuery();
                
                if (!projectRs.next()) {
                    conn.rollback();
                    return "PROJECT_NOT_FOUND";
                }
                
                String status = projectRs.getString("status");
                if (!"PENDING".equals(status)) {
                    conn.rollback();
                    return "PROJECT_ALREADY_PROCESSED";
                }
                
                String committeeName = projectRs.getString("committee_name");
                double projectCost = projectRs.getDouble("total_cost");
                
                // 2. Get committee's allocated budget and total spent
                String budgetSql = "SELECT allocated_amount FROM CommitteeBudget WHERE committee_name = ? AND barangay = ?";
                PreparedStatement budgetStmt = conn.prepareStatement(budgetSql);
                budgetStmt.setString(1, committeeName);
                budgetStmt.setString(2, barangay);
                ResultSet budgetRs = budgetStmt.executeQuery();
                
                if (!budgetRs.next()) {
                    conn.rollback();
                    return "NO_BUDGET_ALLOCATED";
                }
                
                double allocatedAmount = budgetRs.getDouble("allocated_amount");
                
                // 3. Calculate total spent on approved projects
                String spentSql = "SELECT COALESCE(SUM(total_cost), 0) as total_spent FROM Projects " +
                                "WHERE committee_name = ? AND barangay = ? AND status = 'APPROVED'";
                PreparedStatement spentStmt = conn.prepareStatement(spentSql);
                spentStmt.setString(1, committeeName);
                spentStmt.setString(2, barangay);
                ResultSet spentRs = spentStmt.executeQuery();
                
                double totalSpent = 0;
                if (spentRs.next()) {
                    totalSpent = spentRs.getDouble("total_spent");
                }
                
                // 4. Check if approving this project would exceed budget
                if (totalSpent + projectCost > allocatedAmount) {
                    conn.rollback();
                    double remaining = allocatedAmount - totalSpent;
                    return "INSUFFICIENT_BUDGET: Remaining: ₱" + remaining + ", Project Cost: ₱" + projectCost;
                }
                
                // 5. Update project status to APPROVED
                String updateSql = "UPDATE Projects SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, rejection_reason = NULL WHERE id = ?";
                PreparedStatement updateStmt = conn.prepareStatement(updateSql);
                updateStmt.setString(1, approvedBy);
                updateStmt.setInt(2, projectId);
                updateStmt.executeUpdate();
                
                conn.commit();
                return "SUCCESS";
                
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @PostMapping("/rejectProject")
    public String rejectProject(@RequestBody Map<String, Object> request) {
        System.out.println("=== REJECT PROJECT ===");
        System.out.println("Request: " + request);
        
        // Extract values safely
        Object projectIdObj = request.get("projectId");
        String barangay = (String) request.get("barangay");
        String rejectionReason = (String) request.get("rejectionReason");
        String rejectedBy = (String) request.get("rejectedBy");
        
        if (projectIdObj == null) {
            return "PROJECT_ID_REQUIRED";
        }
        
        int projectId;
        if (projectIdObj instanceof Integer) {
            projectId = (Integer) projectIdObj;
        } else if (projectIdObj instanceof String) {
            projectId = Integer.parseInt((String) projectIdObj);
        } else {
            return "INVALID_PROJECT_ID";
        }
        
        System.out.println("Project ID: " + projectId);
        System.out.println("Barangay: " + barangay);
        System.out.println("Reason: " + rejectionReason);
        System.out.println("Rejected By: " + rejectedBy);
        
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            return "REJECTION_REASON_REQUIRED";
        }
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            // First, check if the project exists and is pending
            String checkSql = "SELECT status FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, projectId);
            checkStmt.setString(2, barangay);
            ResultSet rs = checkStmt.executeQuery();
            
            if (!rs.next()) {
                System.out.println("Project not found");
                return "PROJECT_NOT_FOUND";
            }
            
            String currentStatus = rs.getString("status");
            System.out.println("Current status: " + currentStatus);
            
            if (!"PENDING".equals(currentStatus)) {
                System.out.println("Project already processed");
                return "PROJECT_ALREADY_PROCESSED";
            }
            
            // Check if columns exist before updating
            boolean hasRejectionReason = false;
            boolean hasApprovedBy = false;
            boolean hasApprovedAt = false;
            
            try {
                DatabaseMetaData meta = conn.getMetaData();
                ResultSet columns = meta.getColumns(null, null, "Projects", null);
                while (columns.next()) {
                    String colName = columns.getString("COLUMN_NAME");
                    if ("rejection_reason".equals(colName)) hasRejectionReason = true;
                    if ("approved_by".equals(colName)) hasApprovedBy = true;
                    if ("approved_at".equals(colName)) hasApprovedAt = true;
                }
            } catch (Exception e) {
                System.out.println("Error checking columns: " + e.getMessage());
            }
            
            System.out.println("Has rejection_reason: " + hasRejectionReason);
            System.out.println("Has approved_by: " + hasApprovedBy);
            System.out.println("Has approved_at: " + hasApprovedAt);
            
            // Build update SQL based on available columns
            StringBuilder updateSql = new StringBuilder("UPDATE Projects SET status = 'REJECTED'");
            
            if (hasRejectionReason) {
                updateSql.append(", rejection_reason = ?");
            }
            if (hasApprovedBy) {
                updateSql.append(", approved_by = ?");
            }
            if (hasApprovedAt) {
                updateSql.append(", approved_at = CURRENT_TIMESTAMP");
            }
            
            updateSql.append(" WHERE id = ?");
            
            System.out.println("Update SQL: " + updateSql);
            
            PreparedStatement updateStmt = conn.prepareStatement(updateSql.toString());
            int paramIndex = 1;
            
            if (hasRejectionReason) {
                updateStmt.setString(paramIndex++, rejectionReason);
            }
            if (hasApprovedBy) {
                updateStmt.setString(paramIndex++, rejectedBy);
            }
            updateStmt.setInt(paramIndex, projectId);
            
            int rowsAffected = updateStmt.executeUpdate();
            System.out.println("Rows affected: " + rowsAffected);
            
            if (rowsAffected > 0) {
                return "SUCCESS";
            } else {
                return "UPDATE_FAILED";
            }
            
        } catch (SQLException e) {
            e.printStackTrace();
            return "SQL_ERROR: " + e.getMessage();
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    // Add feedback
    @PostMapping("/addFeedback")
    public String addFeedback(@RequestBody Map<String, Object> feedback) {
        String barangay = (String) feedback.get("barangay");
        String name = (String) feedback.get("name");
        String message = (String) feedback.get("message");
        int rating = (int) feedback.getOrDefault("rating", 0);
        
        String sql = "INSERT INTO Feedback (barangay, name, message, rating, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)";
        
        try (Connection conn = DriverManager.getConnection(URL);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, barangay);
            pstmt.setString(2, name);
            pstmt.setString(3, message);
            pstmt.setInt(4, rating);
            pstmt.executeUpdate();
            
            return "SUCCESS";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/setBudget")
    public String setBudget(@RequestBody Budget budget) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1. Validate total allocations do not exceed total budget
            double totalAllocated = 0;
            for (double amount : budget.getAllocations().values()) {
                totalAllocated += amount;
            }

            if (totalAllocated > budget.getTotalBudget()) {
                return "EXCEEDS_TOTAL_BUDGET";
            }

            // 2. Validate each committee exists and has a head assigned
            for (String committeeName : budget.getAllocations().keySet()) {
                String checkSql = "SELECT head_name FROM Committees WHERE name = ? AND barangay = ?";
                PreparedStatement checkStmt = conn.prepareStatement(checkSql);
                checkStmt.setString(1, committeeName);
                checkStmt.setString(2, budget.getBarangay());
                ResultSet rs = checkStmt.executeQuery();

                if (!rs.next()) {
                    return "COMMITTEE_NOT_FOUND:" + committeeName;
                }

                String headName = rs.getString("head_name");
                if (headName == null || headName.isEmpty()) {
                    return "NO_HEAD_ASSIGNED:" + committeeName;
                }
            }

            // 3. Save or update total budget for the barangay
            String upsertBudgetSql = "INSERT INTO Budget (barangay, total_budget) VALUES (?, ?) " +
                                     "ON CONFLICT(barangay) DO UPDATE SET total_budget = ?, updated_at = CURRENT_TIMESTAMP";
            PreparedStatement budgetStmt = conn.prepareStatement(upsertBudgetSql);
            budgetStmt.setString(1, budget.getBarangay());
            budgetStmt.setDouble(2, budget.getTotalBudget());
            budgetStmt.setDouble(3, budget.getTotalBudget());
            budgetStmt.executeUpdate();

            // 4. Save or update each committee's allocated budget
            for (Map.Entry<String, Double> entry : budget.getAllocations().entrySet()) {
                String upsertAllocationSql = "INSERT INTO CommitteeBudget (barangay, committee_name, allocated_amount) VALUES (?, ?, ?) " +
                                             "ON CONFLICT(barangay, committee_name) DO UPDATE SET allocated_amount = ?";
                PreparedStatement allocationStmt = conn.prepareStatement(upsertAllocationSql);
                allocationStmt.setString(1, budget.getBarangay());
                allocationStmt.setString(2, entry.getKey());
                allocationStmt.setDouble(3, entry.getValue());
                allocationStmt.setDouble(4, entry.getValue());
                allocationStmt.executeUpdate();
            }

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getBudget")
    public String getBudget(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            // Get total budget
            String budgetSql = "SELECT total_budget FROM Budget WHERE barangay = ?";
            PreparedStatement budgetStmt = conn.prepareStatement(budgetSql);
            budgetStmt.setString(1, barangay);
            ResultSet budgetRs = budgetStmt.executeQuery();

            double totalBudget = 0;
            if (budgetRs.next()) {
                totalBudget = budgetRs.getDouble("total_budget");
            }

            // Get per-committee allocation and spending
            String allocSql = "SELECT cb.committee_name, cb.allocated_amount, " +
                              "COALESCE(SUM(p.total_cost), 0) AS spent " +
                              "FROM CommitteeBudget cb " +
                              "LEFT JOIN Projects p ON p.committee_name = cb.committee_name " +
                              "AND p.barangay = cb.barangay AND p.status = 'APPROVED' " +
                              "WHERE cb.barangay = ? " +
                              "GROUP BY cb.committee_name, cb.allocated_amount";
            PreparedStatement allocStmt = conn.prepareStatement(allocSql);
            allocStmt.setString(1, barangay);
            ResultSet allocRs = allocStmt.executeQuery();

            StringBuilder result = new StringBuilder();
            result.append("{\"totalBudget\":").append(totalBudget).append(",\"committees\":[");

            while (allocRs.next()) {
                double allocated = allocRs.getDouble("allocated_amount");
                double spent = allocRs.getDouble("spent");
                result.append("{")
                      .append("\"committeeName\":\"").append(allocRs.getString("committee_name")).append("\",")
                      .append("\"allocated\":").append(allocated).append(",")
                      .append("\"spent\":").append(spent).append(",")
                      .append("\"remaining\":").append(allocated - spent)
                      .append("},");
            }
            if (result.charAt(result.length() - 1) == ',') result.setLength(result.length() - 1);
            result.append("]}");

            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
}