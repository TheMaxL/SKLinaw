package com.example.sklinaw;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/admin")
@CrossOrigin
@RestController
public class AdminController {

    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    // 🔹 Get pending accounts
    @GetMapping("/users")
    public List<Map<String, Object>> getUsers() {

        List<Map<String, Object>> users = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql = "SELECT rowid as id, Name, Barangay, Photo FROM PendingAccounts";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {

                Map<String, Object> user = new HashMap<>();

                user.put("id", rs.getInt("id"));
                user.put("name", rs.getString("Name"));
                user.put("barangay", rs.getString("Barangay"));
                user.put("photo", rs.getString("Photo"));
                user.put("approved", 0); // always pending

                users.add(user);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return users;
    }

    // 🔹 Approve user
    @PostMapping("/users/{id}/approve")
    public void approveUser(@PathVariable int id) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // get pending account
            String selectSql = "SELECT * FROM PendingAccounts WHERE rowid = ?";
            PreparedStatement selectStmt = conn.prepareStatement(selectSql);
            selectStmt.setInt(1, id);

            ResultSet rs = selectStmt.executeQuery();

            if (rs.next()) {

                String name = rs.getString("Name");
                String password = rs.getString("Password");
                String barangay = rs.getString("Barangay");

                // insert into councilors
                String insertSql = "INSERT INTO Councilors (Name,Password,Barangay,approved) VALUES (?,?,?,1)";
                PreparedStatement insertStmt = conn.prepareStatement(insertSql);

                insertStmt.setString(1, name);
                insertStmt.setString(2, password);
                insertStmt.setString(3, barangay);

                insertStmt.executeUpdate();

                // delete from pending
                String deleteSql = "DELETE FROM PendingAccounts WHERE rowid = ?";
                PreparedStatement deleteStmt = conn.prepareStatement(deleteSql);

                deleteStmt.setInt(1, id);
                deleteStmt.executeUpdate();
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // 🔹 Reject user
    @PostMapping("/users/{id}/reject")
    public void rejectUser(@PathVariable int id) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql = "DELETE FROM PendingAccounts WHERE rowid = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    //Get councilors from Barangay
    @GetMapping("/councilors")
    public List<Account> getCouncilors(@RequestParam(required = false) String barangay) {
        String sql = "SELECT rowid, Name, Password, Barangay, approved, privilege FROM Councilors";
        if (barangay != null && !barangay.isEmpty()) {
            sql += " WHERE Barangay = ?";
        }
        
        try (Connection conn = DriverManager.getConnection(URL);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            if (barangay != null && !barangay.isEmpty()) {
                pstmt.setString(1, barangay);
            }
            
            ResultSet rs = pstmt.executeQuery();
            List<Account> accounts = new ArrayList<>();
            
            while (rs.next()) {
                Account account = new Account();
                account.setId(rs.getInt("rowid"));
                account.setName(rs.getString("Name"));
                account.setPassword(rs.getString("Password"));
                account.setBarangay(rs.getString("Barangay"));
                account.setApproved(rs.getInt("approved"));
                account.setPrivilege(rs.getString("privilege"));
                accounts.add(account);
            }
            return accounts;
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @PutMapping("/councilors/{id}/privilege")
    public String updatePrivilege(@PathVariable int id, @RequestBody Map<String, String> request) {
        String privilege = request.get("privilege");
        if(privilege == null || privilege.isEmpty()) {
            privilege = null;
        }
        String sql = "UPDATE Councilors SET privilege = ? WHERE rowid = ?";
        try (Connection conn = DriverManager.getConnection(URL);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
                pstmt.setString(1, privilege);
                pstmt.setInt(2, id);

                int rowsUpdated = pstmt.executeUpdate();
                if (rowsUpdated > 0) {
                    return "SUCCESS";
                } else {
                    return "COUNCILOR_NOT_FOUND";
                }
            } catch (Exception e) {
                e.printStackTrace();
                return "Error: " + e.getMessage();
            }
    }

    @PostMapping("/turnover/{barangay}")
    public Map<String, Object> performTurnover(@PathVariable String barangay) {
        Map<String, Object> response = new HashMap<>();
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            conn.setAutoCommit(false);
            
            try {
                // Track what was cleared
                int committeesCleared = 0;
                int projectsCleared = 0;
                int expensesCleared = 0;
                int budgetCleared = 0;
                int membersCleared = 0;
                int councilorsArchived = 0;
                
                // 1. Archive councilors before clearing (optional - for audit trail)
                String archiveSql = "INSERT INTO ArchivedCouncilors (name, barangay, privilege, cleared_at) " +
                                "SELECT Name, Barangay, privilege, CURRENT_TIMESTAMP FROM Councilors WHERE Barangay = ?";
                PreparedStatement archiveStmt = conn.prepareStatement(archiveSql);
                archiveStmt.setString(1, barangay);
                councilorsArchived = archiveStmt.executeUpdate();
                
                // 2. Clear committee members
                String clearMembersSql = "DELETE FROM CommitteeMembers WHERE barangay = ?";
                PreparedStatement clearMembersStmt = conn.prepareStatement(clearMembersSql);
                clearMembersStmt.setString(1, barangay);
                membersCleared = clearMembersStmt.executeUpdate();
                
                // 3. Clear projects
                String clearProjectsSql = "DELETE FROM Projects WHERE barangay = ?";
                PreparedStatement clearProjectsStmt = conn.prepareStatement(clearProjectsSql);
                clearProjectsStmt.setString(1, barangay);
                projectsCleared = clearProjectsStmt.executeUpdate();
                
                // 4. Clear expenses
                String clearExpensesSql = "DELETE FROM Expenses WHERE barangay = ?";
                PreparedStatement clearExpensesStmt = conn.prepareStatement(clearExpensesSql);
                clearExpensesStmt.setString(1, barangay);
                expensesCleared = clearExpensesStmt.executeUpdate();
                
                // 5. Clear committee budgets
                String clearBudgetSql = "DELETE FROM CommitteeBudget WHERE barangay = ?";
                PreparedStatement clearBudgetStmt = conn.prepareStatement(clearBudgetSql);
                clearBudgetStmt.setString(1, barangay);
                budgetCleared = clearBudgetStmt.executeUpdate();
                
                // 6. Clear committees (this will also remove heads since head_name is a column)
                String clearCommitteesSql = "DELETE FROM Committees WHERE barangay = ?";
                PreparedStatement clearCommitteesStmt = conn.prepareStatement(clearCommitteesSql);
                clearCommitteesStmt.setString(1, barangay);
                committeesCleared = clearCommitteesStmt.executeUpdate();
                
                // 7. Clear or archive councilors (remove from active councilors)
                String clearCouncilorsSql = "DELETE FROM Councilors WHERE Barangay = ?";
                PreparedStatement clearCouncilorsStmt = conn.prepareStatement(clearCouncilorsSql);
                clearCouncilorsStmt.setString(1, barangay);
                int councilorsCleared = clearCouncilorsStmt.executeUpdate();
                
                // 8. Clear barangay budget
                String clearBarangayBudgetSql = "DELETE FROM Budget WHERE barangay = ?";
                PreparedStatement clearBarangayBudgetStmt = conn.prepareStatement(clearBarangayBudgetSql);
                clearBarangayBudgetStmt.setString(1, barangay);
                clearBarangayBudgetStmt.executeUpdate();
                
                conn.commit();
                
                response.put("status", "SUCCESS");
                response.put("message", "Turnover completed for " + barangay);
                response.put("barangay", barangay);
                response.put("statistics", Map.of(
                    "councilorsArchived", councilorsArchived,
                    "councilorsCleared", councilorsCleared,
                    "committeesCleared", committeesCleared,
                    "projectsCleared", projectsCleared,
                    "expensesCleared", expensesCleared,
                    "membersCleared", membersCleared,
                    "budgetCleared", budgetCleared
                ));
                
            } catch (Exception e) {
                conn.rollback();
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("status", "ERROR");
            response.put("message", e.getMessage());
        }
        
        return response;
    }

    // 🔹 Get turnover status for a barangay
    @GetMapping("/turnover/status/{barangay}")
    public Map<String, Object> getTurnoverStatus(@PathVariable String barangay) {
        Map<String, Object> status = new HashMap<>();
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            
            // Check active councilors
            String councilorSql = "SELECT COUNT(*) as count FROM Councilors WHERE Barangay = ?";
            PreparedStatement councilorStmt = conn.prepareStatement(councilorSql);
            councilorStmt.setString(1, barangay);
            ResultSet councilorRs = councilorStmt.executeQuery();
            int activeCouncilors = councilorRs.next() ? councilorRs.getInt("count") : 0;
            
            // Check committees
            String committeeSql = "SELECT COUNT(*) as count FROM Committees WHERE barangay = ?";
            PreparedStatement committeeStmt = conn.prepareStatement(committeeSql);
            committeeStmt.setString(1, barangay);
            ResultSet committeeRs = committeeStmt.executeQuery();
            int activeCommittees = committeeRs.next() ? committeeRs.getInt("count") : 0;
            
            // Check projects
            String projectSql = "SELECT COUNT(*) as count FROM Projects WHERE barangay = ?";
            PreparedStatement projectStmt = conn.prepareStatement(projectSql);
            projectStmt.setString(1, barangay);
            ResultSet projectRs = projectStmt.executeQuery();
            int activeProjects = projectRs.next() ? projectRs.getInt("count") : 0;
            
            status.put("barangay", barangay);
            status.put("activeCouncilors", activeCouncilors);
            status.put("activeCommittees", activeCommittees);
            status.put("activeProjects", activeProjects);
            status.put("hasData", activeCouncilors > 0 || activeCommittees > 0 || activeProjects > 0);
            
        } catch (Exception e) {
            e.printStackTrace();
            status.put("error", e.getMessage());
        }
        
        return status;
    }

    // 🔹 Get all barangays with data
    @GetMapping("/turnover/barangays")
    public List<String> getBarangaysWithData() {
        List<String> barangays = new ArrayList<>();
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            String sql = "SELECT DISTINCT Barangay FROM Councilors UNION " +
                        "SELECT DISTINCT barangay FROM Committees UNION " +
                        "SELECT DISTINCT barangay FROM Projects";
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery();
            
            while (rs.next()) {
                barangays.add(rs.getString("Barangay"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return barangays;
    }
}