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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.sklinaw.model.Budget;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {
    "http://localhost:8085",
    "https://pitcherlike-unformalistic-armandina.ngrok-free.dev"
}, allowCredentials = "true")
public class Budgetcontroller {

    @Autowired
    private DataSource dataSource;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @PostMapping("/setBudget")
    public String setBudget(@RequestBody Budget budget) {
        try (Connection conn = dataSource.getConnection()) {
            double totalAllocated = 0;
            for (double amount : budget.getAllocations().values()) {
                totalAllocated += amount;
            }

            if (totalAllocated > budget.getTotalBudget()) {
                return "EXCEEDS_TOTAL_BUDGET";
            }

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

            String upsertBudgetSql = "INSERT INTO Budget (barangay, total_budget) VALUES (?, ?) " +
                                     "ON CONFLICT(barangay) DO UPDATE SET total_budget = ?, updated_at = CURRENT_TIMESTAMP";
            PreparedStatement budgetStmt = conn.prepareStatement(upsertBudgetSql);
            budgetStmt.setString(1, budget.getBarangay());
            budgetStmt.setDouble(2, budget.getTotalBudget());
            budgetStmt.setDouble(3, budget.getTotalBudget());
            budgetStmt.executeUpdate();

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
        try (Connection conn = dataSource.getConnection()) {
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

            boolean hasCommittees = false;
            while (allocRs.next()) {
                if (hasCommittees) {
                    result.append(",");
                }
                hasCommittees = true;
                
                double allocated = allocRs.getDouble("allocated_amount");
                double spent = allocRs.getDouble("spent");
                result.append("{")
                    .append("\"committeeName\":\"").append(escape(allocRs.getString("committee_name"))).append("\",")
                    .append("\"allocated\":").append(allocated).append(",")
                    .append("\"spent\":").append(spent).append(",")
                    .append("\"remaining\":").append(allocated - spent)
                    .append("}");
            }
            
            result.append("]}");
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"totalBudget\":0,\"committees\":[]}";
        }
    }

    @GetMapping("/getOverallBudgetSummary")
    public String getOverallBudgetSummary(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            String budgetSql = "SELECT COALESCE(SUM(allocated_amount), 0) as total_allocated FROM CommitteeBudget WHERE barangay = ?";
            PreparedStatement budgetStmt = conn.prepareStatement(budgetSql);
            budgetStmt.setString(1, barangay);
            ResultSet budgetRs = budgetStmt.executeQuery();
            double totalAllocated = budgetRs.next() ? budgetRs.getDouble("total_allocated") : 0;
            
            String spentSql = "SELECT COALESCE(SUM(total_cost), 0) as total_spent FROM Projects WHERE barangay = ? AND status = 'APPROVED'";
            PreparedStatement spentStmt = conn.prepareStatement(spentSql);
            spentStmt.setString(1, barangay);
            ResultSet spentRs = spentStmt.executeQuery();
            double totalSpent = spentRs.next() ? spentRs.getDouble("total_spent") : 0;
            
            double percentage = totalAllocated > 0 ? (totalSpent / totalAllocated * 100) : 0;
            
            StringBuilder result = new StringBuilder();
            result.append("{")
                  .append("\"totalAllocated\":").append(totalAllocated).append(",")
                  .append("\"totalSpent\":").append(totalSpent).append(",")
                  .append("\"totalRemaining\":").append(totalAllocated - totalSpent).append(",")
                  .append("\"percentage\":").append(percentage)
                  .append("}");
            return result.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getCommitteeBudgetUtilization")
    public String getCommitteeBudgetUtilization(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT cb.committee_name, cb.allocated_amount, " +
                         "COALESCE(SUM(p.total_cost), 0) AS spent " +
                         "FROM CommitteeBudget cb " +
                         "LEFT JOIN Projects p ON p.committee_name = cb.committee_name " +
                         "AND p.barangay = cb.barangay AND p.status = 'APPROVED' " +
                         "WHERE cb.barangay = ? " +
                         "GROUP BY cb.committee_name, cb.allocated_amount";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                double allocated = rs.getDouble("allocated_amount");
                double spent = rs.getDouble("spent");
                double percentage = allocated > 0 ? (spent / allocated * 100) : 0;
                result.append("{")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"allocated\":").append(allocated).append(",")
                      .append("\"spent\":").append(spent).append(",")
                      .append("\"remaining\":").append(allocated - spent).append(",")
                      .append("\"percentage\":").append(percentage)
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

    @GetMapping("/getCommitteeBudgetSummary")
    public String getCommitteeBudgetSummary(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT cb.committee_name, cb.allocated_amount, " +
                         "COALESCE(SUM(CASE WHEN p.status = 'APPROVED' THEN p.total_cost ELSE 0 END), 0) as spent " +
                         "FROM CommitteeBudget cb " +
                         "LEFT JOIN Projects p ON p.committee_name = cb.committee_name " +
                         "AND p.barangay = cb.barangay " +
                         "WHERE cb.barangay = ? " +
                         "GROUP BY cb.committee_name, cb.allocated_amount";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                double allocated = rs.getDouble("allocated_amount");
                double spent = rs.getDouble("spent");
                result.append("{")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"allocated\":").append(allocated).append(",")
                      .append("\"spent\":").append(spent).append(",")
                      .append("\"remaining\":").append(allocated - spent)
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

    @GetMapping("/getRecentExpenditures")
    public String getRecentExpenditures(@RequestParam String barangay, @RequestParam(defaultValue = "5") int limit) {
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT p.id, p.project_name, p.committee_name, p.total_cost, p.approved_at " +
                         "FROM Projects p " +
                         "WHERE p.barangay = ? AND p.status = 'APPROVED' " +
                         "ORDER BY p.approved_at DESC LIMIT ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setInt(2, limit);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"projectName\":\"").append(escape(rs.getString("project_name"))).append("\",")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"totalCost\":").append(rs.getDouble("total_cost")).append(",")
                      .append("\"approvedAt\":\"").append(escape(rs.getString("approved_at"))).append("\"")
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

    @GetMapping("/getExpenses")
    public String getExpenses(@RequestParam String barangay) {
        try (Connection conn = dataSource.getConnection()) {
            // Query your existing Expenses table
            String sql = "SELECT e.id, e.description, e.amount, e.date, " +
                        "p.committee_name, p.councilor_name, 'PROJECT' as type " +
                        "FROM Expenses e " +
                        "LEFT JOIN Projects p ON e.project_id = p.id " +
                        "WHERE e.barangay = ? " +
                        "UNION ALL " +
                        "SELECT p.id, p.project_name as description, p.total_cost as amount, p.approved_at as date, " +
                        "p.committee_name, p.councilor_name, 'APPROVED_PROJECT' as type " +
                        "FROM Projects p " +
                        "WHERE p.barangay = ? AND p.status = 'APPROVED' " +
                        "ORDER BY date DESC";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setString(2, barangay);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"description\":\"").append(escape(rs.getString("description"))).append("\",")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name") != null ? rs.getString("committee_name") : "General")).append("\",")
                    .append("\"councilorName\":\"").append(escape(rs.getString("councilor_name") != null ? rs.getString("councilor_name") : "System")).append("\",")
                    .append("\"amount\":").append(rs.getDouble("amount")).append(",")
                    .append("\"date\":\"").append(escape(rs.getString("date"))).append("\",")
                    .append("\"type\":\"").append(escape(rs.getString("type"))).append("\"")
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

    @GetMapping("/getBudgetByCommittee")
    public String getBudgetByCommittee(@RequestParam String barangay, @RequestParam String committeeName) {
        try (Connection conn = dataSource.getConnection()) {
            // Get total budget for barangay
            String budgetSql = "SELECT total_budget FROM Budget WHERE barangay = ?";
            PreparedStatement budgetStmt = conn.prepareStatement(budgetSql);
            budgetStmt.setString(1, barangay);
            ResultSet budgetRs = budgetStmt.executeQuery();
            double totalBudget = budgetRs.next() ? budgetRs.getDouble("total_budget") : 0;
            
            // Get committee allocation and spending
            String allocSql = "SELECT cb.allocated_amount, " +
                            "COALESCE(SUM(p.total_cost), 0) AS spent " +
                            "FROM CommitteeBudget cb " +
                            "LEFT JOIN Projects p ON p.committee_name = cb.committee_name " +
                            "AND p.barangay = cb.barangay AND p.status = 'APPROVED' " +
                            "WHERE cb.committee_name = ? AND cb.barangay = ? " +
                            "GROUP BY cb.allocated_amount";
            PreparedStatement allocStmt = conn.prepareStatement(allocSql);
            allocStmt.setString(1, committeeName);
            allocStmt.setString(2, barangay);
            ResultSet allocRs = allocStmt.executeQuery();
            
            double allocated = 0;
            double spent = 0;
            if (allocRs.next()) {
                allocated = allocRs.getDouble("allocated_amount");
                spent = allocRs.getDouble("spent");
            }
            
            double remaining = allocated - spent;
            
            StringBuilder result = new StringBuilder();
            result.append("{")
                .append("\"totalBudget\":").append(totalBudget).append(",")
                .append("\"committeeName\":\"").append(escape(committeeName)).append("\",")
                .append("\"allocated\":").append(allocated).append(",")
                .append("\"spent\":").append(spent).append(",")
                .append("\"remaining\":").append(remaining)
                .append("}");
            return result.toString();
            
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