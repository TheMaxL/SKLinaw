package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.sklinaw.model.project;

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
public class Projectcontroller {
    @Autowired
    private DataSource dataSource;
    
    @Value("${spring.datasource.url}")
    private String dbUrl;

    @PostMapping("/addProject")
    public String addProject(@RequestBody project project) {
        try (Connection conn = dataSource.getConnection()) {

            String budgetSql = "SELECT allocated_amount FROM CommitteeBudget WHERE committee_name = ? AND barangay = ?";
            PreparedStatement budgetStmt = conn.prepareStatement(budgetSql);
            budgetStmt.setString(1, project.getCommitteeName());
            budgetStmt.setString(2, project.getBarangay());
            ResultSet budgetRs = budgetStmt.executeQuery();
            
            double allocatedAmount = 0;
            if (budgetRs.next()) {
                allocatedAmount = budgetRs.getDouble("allocated_amount");
            } else {
                return "NO_BUDGET_ALLOCATED";
            }
            
            // Calculate total spent on APPROVED projects only (ignore PENDING)
            String approvedSql = "SELECT COALESCE(SUM(total_cost), 0) as total_approved FROM Projects " +
                                "WHERE committee_name = ? AND barangay = ? AND status = 'APPROVED'";
            PreparedStatement approvedStmt = conn.prepareStatement(approvedSql);
            approvedStmt.setString(1, project.getCommitteeName());
            approvedStmt.setString(2, project.getBarangay());
            ResultSet approvedRs = approvedStmt.executeQuery();
            
            double totalApproved = 0;
            if (approvedRs.next()) {
                totalApproved = approvedRs.getDouble("total_approved");
            }
            
            // Check if this new project would exceed the allocated budget (when approved)
            double remainingBudget = allocatedAmount - totalApproved;
            
            System.out.println("=== BUDGET CHECK ===");
            System.out.println("Committee: " + project.getCommitteeName());
            System.out.println("Allocated: " + allocatedAmount);
            System.out.println("Approved total: " + totalApproved);
            System.out.println("New Project Cost: " + project.getTotalCost());
            System.out.println("Remaining budget: " + remainingBudget);
            
            if (project.getTotalCost() > remainingBudget) {
                return "INSUFFICIENT_BUDGET: Project cost ₱" + project.getTotalCost() + 
                    " exceeds remaining budget of ₱" + remainingBudget;
            }

            // 5. Insert project with status PENDING (even if total pending exceeds budget)
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
        try (Connection conn = dataSource.getConnection()) {
            // ✅ Add rejection_reason to the SELECT query
            String sql = "SELECT id, project_name, purpose, councilor_name, total_cost, status, created_at, rejection_reason " +
                        "FROM Projects WHERE barangay = ? AND committee_name = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setString(2, committeeName);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"rejectionReason\":\"").append(escape(rs.getString("rejection_reason") != null ? rs.getString("rejection_reason") : "")).append("\"")
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

    @GetMapping("/getProjectsByCouncilor")
    public String getProjectsByCouncilor(@RequestParam String councilor, @RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT id, project_name, purpose, committee_name, total_cost, status, created_at, approved_at " +
                         "FROM Projects WHERE councilor_name = ? AND barangay = ? ORDER BY created_at DESC";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, councilor);
            stmt.setString(2, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                      .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                      .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                      .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                      .append("\"approvedAt\":\"").append(escape(rs.getString("approved_at") != null ? rs.getString("approved_at") : "")).append("\"")
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
        try (Connection conn = dataSource.getConnection()) {
            
            String sql = "SELECT p.id, p.project_name, p.purpose, p.committee_name, p.councilor_name, " +
                        "p.total_cost, p.status, p.created_at, p.rejection_reason, c.head_name as committee_head " +
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
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"rejectionReason\":\"").append(escape(rs.getString("rejection_reason") != null ? rs.getString("rejection_reason") : "")).append("\",")
                    .append("\"committeeHead\":\"").append(escape(rs.getString("committee_head") != null ? rs.getString("committee_head") : "")).append("\"")
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
        try (Connection conn = dataSource.getConnection()) {
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
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"approvedAt\":\"").append(escape(rs.getString("approved_at") != null ? rs.getString("approved_at") : "")).append("\",")
                    .append("\"committeeHead\":\"").append(escape(rs.getString("committee_head") != null ? rs.getString("committee_head") : "")).append("\"")
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
        try (Connection conn = dataSource.getConnection()) {
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
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"approvedAt\":\"").append(escape(rs.getString("approved_at"))).append("\",")
                    .append("\"approvedBy\":\"").append(escape(rs.getString("approved_by") != null ? rs.getString("approved_by") : "")).append("\",")
                    .append("\"committeeHead\":\"").append(escape(rs.getString("committee_head") != null ? rs.getString("committee_head") : "")).append("\"")
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
        try (Connection conn = dataSource.getConnection()) {
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
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"approvedAt\":\"").append(escape(rs.getString("approved_at") != null ? rs.getString("approved_at") : "")).append("\",")
                    .append("\"approvedBy\":\"").append(escape(rs.getString("approved_by") != null ? rs.getString("approved_by") : "")).append("\",")
                    .append("\"rejectionReason\":\"").append(escape(rs.getString("rejection_reason") != null ? rs.getString("rejection_reason") : "")).append("\"")
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

    @GetMapping("/getProjectById")
    public String getProjectById(@RequestParam int projectId) {
        try (Connection conn = dataSource.getConnection()) {
            // ✅ Add rejection_reason to the SELECT query
            String sql = "SELECT id, project_name, purpose, committee_name, councilor_name, total_cost, status, created_at, barangay, rejection_reason " +
                        "FROM Projects WHERE id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();
            
            if (rs.next()) {
                StringBuilder result = new StringBuilder();
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                    .append("\"purpose\":\"").append(escape(rs.getString("purpose"))).append("\",")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
                    .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                    .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                    .append("\"createdAt\":\"").append(escape(rs.getString("created_at"))).append("\",")
                    .append("\"barangay\":\"").append(escape(rs.getString("barangay"))).append("\",")
                    .append("\"rejectionReason\":\"").append(escape(rs.getString("rejection_reason") != null ? rs.getString("rejection_reason") : "")).append("\"")
                    .append("}");
                return result.toString();
            }
            return "PROJECT_NOT_FOUND";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PutMapping("/updateProject")
    public String updateProject(@RequestBody Map<String, Object> request) {
        System.out.println("=== UPDATE PROJECT ===");
        
        try (Connection conn = dataSource.getConnection()) {
            
            // Extract values
            int projectId = (int) request.get("id");
            String projectName = (String) request.get("projectName");
            String purpose = (String) request.get("purpose");
            double newCost = ((Number) request.get("totalCost")).doubleValue();
            String barangay = (String) request.get("barangay");
            
            // Get the project's current details
            String getProjectSql = "SELECT committee_name, total_cost, status FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement getProjectStmt = conn.prepareStatement(getProjectSql);
            getProjectStmt.setInt(1, projectId);
            getProjectStmt.setString(2, barangay);
            ResultSet projectRs = getProjectStmt.executeQuery();
            
            if (!projectRs.next()) {
                return "PROJECT_NOT_FOUND";
            }
            
            String status = projectRs.getString("status");
            if (!"PENDING".equals(status)) {
                return "CANNOT_EDIT_APPROVED_PROJECT";
            }
            
            // Update the project (no budget check needed for edits)
            String updateSql = "UPDATE Projects SET project_name = ?, purpose = ?, total_cost = ? WHERE id = ?";
            PreparedStatement updateStmt = conn.prepareStatement(updateSql);
            updateStmt.setString(1, projectName);
            updateStmt.setString(2, purpose);
            updateStmt.setDouble(3, newCost);
            updateStmt.setInt(4, projectId);
            int rows = updateStmt.executeUpdate();
            
            return rows > 0 ? "SUCCESS" : "UPDATE_FAILED";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @PostMapping("/approveProject")
    public String approveProject(@RequestBody Map<String, Object> request) {
        int projectId = (int) request.get("projectId");
        String barangay = (String) request.get("barangay");
        String approvedBy = (String) request.get("approvedBy");
        
        try (Connection conn = dataSource.getConnection()) {
            
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
                
                // 2. Check remaining budget (including other pending projects that may be approved later)
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
                
                // Calculate total spent on approved projects (excluding this one)
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
                
                // Calculate remaining budget
                double remainingBudget = allocatedAmount - totalSpent;
                
                System.out.println("=== APPROVE BUDGET CHECK ===");
                System.out.println("Committee: " + committeeName);
                System.out.println("Allocated: " + allocatedAmount);
                System.out.println("Total Spent: " + totalSpent);
                System.out.println("Project Cost: " + projectCost);
                System.out.println("Remaining: " + remainingBudget);
                
                // Check if approving this project would exceed budget
                if (projectCost > remainingBudget) {
                    conn.rollback();
                    return "INSUFFICIENT_BUDGET: Cannot approve. Remaining budget: ₱" + remainingBudget;
                }
                
                // 3. Update project status to APPROVED
                String updateSql = "UPDATE Projects SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?";
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

    @DeleteMapping("/deleteProject")
    public String deleteProject(@RequestBody Map<String, Object> request) {
        int projectId = (int) request.get("projectId");
        String barangay = (String) request.get("barangay");
        
        try (Connection conn = dataSource.getConnection()) {
            
            // Check if project exists and is PENDING (only pending projects can be deleted)
            String checkSql = "SELECT status FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, projectId);
            checkStmt.setString(2, barangay);
            ResultSet rs = checkStmt.executeQuery();
            
            if (!rs.next()) {
                return "PROJECT_NOT_FOUND";
            }
            
            String status = rs.getString("status");
            if (!"PENDING".equals(status)) {
                return "CANNOT_DELETE_APPROVED_PROJECT";
            }
            
            // Delete the project
            String deleteSql = "DELETE FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement deleteStmt = conn.prepareStatement(deleteSql);
            deleteStmt.setInt(1, projectId);
            deleteStmt.setString(2, barangay);
            int rows = deleteStmt.executeUpdate();
            
            return rows > 0 ? "SUCCESS" : "DELETE_FAILED";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @PostMapping("/rejectProject")
    public String rejectProject(@RequestBody Map<String, Object> request) {
        Object projectIdObj = request.get("projectId");
        String barangay = (String) request.get("barangay");
        String rejectionReason = (String) request.get("rejectionReason");
        String rejectedBy = (String) request.get("rejectedBy");
        
        if (projectIdObj == null) return "PROJECT_ID_REQUIRED";
        
        int projectId = (Integer) projectIdObj;
        
        try (Connection conn = dataSource.getConnection()) {
            String checkSql = "SELECT status FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, projectId);
            checkStmt.setString(2, barangay);
            ResultSet rs = checkStmt.executeQuery();
            
            if (!rs.next()) return "PROJECT_NOT_FOUND";
            if (!"PENDING".equals(rs.getString("status"))) return "PROJECT_ALREADY_PROCESSED";
            
            String updateSql = "UPDATE Projects SET status = 'REJECTED', rejection_reason = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?";
            PreparedStatement updateStmt = conn.prepareStatement(updateSql);
            updateStmt.setString(1, rejectionReason);
            updateStmt.setString(2, rejectedBy);
            updateStmt.setInt(3, projectId);
            updateStmt.executeUpdate();
            
            return "SUCCESS";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}