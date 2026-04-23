package com.example.sklinaw;

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
@CrossOrigin
public class ExpensesController {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    /**
     * Returns all expenses for a barangay — combining:
     *   1. Project total costs (from Projects table, status = APPROVED)
     *   2. Individual payment entries (from Payments table)
     *
     * Optional filter by committeeName.
     *
     * Example: GET /api/getExpenses?barangay=Lahug
     * Example: GET /api/getExpenses?barangay=Lahug&committeeName=Sports
     */
    @GetMapping("/getExpenses")
    public String getExpenses(
            @RequestParam String barangay,
            @RequestParam(required = false) String committeeName) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            StringBuilder result = new StringBuilder("[");
            boolean hasRows = false;

            // ── 1. Project costs ──────────────────────────────────────────
            String projectSql =
                "SELECT p.id, p.project_name AS description, p.committee_name, " +
                "p.councilor_name, p.total_cost AS amount, p.created_at AS date, " +
                "'PROJECT' AS type " +
                "FROM Projects p " +
                "WHERE p.barangay = ? AND p.status = 'APPROVED' AND p.total_cost > 0" +
                (committeeName != null && !committeeName.isEmpty() ? " AND p.committee_name = ?" : "") +
                " ORDER BY p.created_at DESC";

            PreparedStatement pStmt = conn.prepareStatement(projectSql);
            pStmt.setString(1, barangay);
            if (committeeName != null && !committeeName.isEmpty()) {
                pStmt.setString(2, committeeName);
            }

            ResultSet pRs = pStmt.executeQuery();
            while (pRs.next()) {
                if (hasRows) result.append(",");
                result.append("{")
                      .append("\"id\":").append(pRs.getInt("id")).append(",")
                      .append("\"description\":\"").append(escape(pRs.getString("description"))).append("\",")
                      .append("\"committeeName\":\"").append(escape(pRs.getString("committee_name"))).append("\",")
                      .append("\"councilorName\":\"").append(escape(pRs.getString("councilor_name"))).append("\",")
                      .append("\"amount\":").append(pRs.getDouble("amount")).append(",")
                      .append("\"date\":\"").append(escape(pRs.getString("date"))).append("\",")
                      .append("\"type\":\"PROJECT\"")
                      .append("}");
                hasRows = true;
            }

            // ── 2. Individual payment entries ─────────────────────────────
            // Check if Payments table exists first
            String tableCheckSql =
                "SELECT name FROM sqlite_master WHERE type='table' AND name='Payments'";
            PreparedStatement tableCheck = conn.prepareStatement(tableCheckSql);
            ResultSet tableRs = tableCheck.executeQuery();

            if (tableRs.next()) {
                String paymentSql =
                    "SELECT pay.id, pay.description, pay.committee_name, " +
                    "pay.councilor_name, pay.amount, pay.created_at AS date, " +
                    "'PAYMENT' AS type " +
                    "FROM Payments pay " +
                    "WHERE pay.barangay = ?" +
                    (committeeName != null && !committeeName.isEmpty() ? " AND pay.committee_name = ?" : "") +
                    " ORDER BY pay.created_at DESC";

                PreparedStatement payStmt = conn.prepareStatement(paymentSql);
                payStmt.setString(1, barangay);
                if (committeeName != null && !committeeName.isEmpty()) {
                    payStmt.setString(2, committeeName);
                }

                ResultSet payRs = payStmt.executeQuery();
                while (payRs.next()) {
                    if (hasRows) result.append(",");
                    result.append("{")
                          .append("\"id\":").append(payRs.getInt("id")).append(",")
                          .append("\"description\":\"").append(escape(payRs.getString("description"))).append("\",")
                          .append("\"committeeName\":\"").append(escape(payRs.getString("committee_name"))).append("\",")
                          .append("\"councilorName\":\"").append(escape(payRs.getString("councilor_name"))).append("\",")
                          .append("\"amount\":").append(payRs.getDouble("amount")).append(",")
                          .append("\"date\":\"").append(escape(payRs.getString("date"))).append("\",")
                          .append("\"type\":\"PAYMENT\"")
                          .append("}");
                    hasRows = true;
                }
            }

            result.append("]");
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    /**
     * Returns a summary of total expenses grouped by committee.
     * Used for the budget page expense summary container.
     *
     * Example: GET /api/getExpenseSummary?barangay=Lahug
     */
    @GetMapping("/getExpenseSummary")
    public String getExpenseSummary(@RequestParam String barangay) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            StringBuilder result = new StringBuilder("[");
            boolean hasRows = false;

            // Sum project costs per committee
            String sql =
                "SELECT committee_name, " +
                "COUNT(*) AS entry_count, " +
                "SUM(total_cost) AS total_spent " +
                "FROM Projects " +
                "WHERE barangay = ? AND status = 'APPROVED' " +
                "GROUP BY committee_name " +
                "ORDER BY total_spent DESC";

            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                if (hasRows) result.append(",");
                result.append("{")
                      .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                      .append("\"entryCount\":").append(rs.getInt("entry_count")).append(",")
                      .append("\"totalSpent\":").append(rs.getDouble("total_spent"))
                      .append("}");
                hasRows = true;
            }

            result.append("]");
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    // Escape special chars for JSON string safety
    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}
