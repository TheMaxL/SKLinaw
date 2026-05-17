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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.sklinaw.model.CommitteeMember;

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
public class Committeecontroller {
    @Autowired
    private DataSource dataSource;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @PostMapping("/createCommittee")
    public String createCommittee(@RequestBody CommitteeMember committee) {
        try (Connection conn = dataSource.getConnection()) {
            // Start transaction
            conn.setAutoCommit(false);
            
            try {
                // Check committee doesn't already exist
                String checkSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
                PreparedStatement checkStmt = conn.prepareStatement(checkSql);
                checkStmt.setString(1, committee.getCommitteeName());
                checkStmt.setString(2, committee.getBarangay());
                ResultSet rs = checkStmt.executeQuery();

                if (rs.next()) {
                    conn.rollback();
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
                        conn.rollback();
                        return "COUNCILOR_NOT_IN_BARANGAY";
                    }
                    
                    // Check if councilor already heads another committee
                    String headCheckSql = "SELECT * FROM Committees WHERE head_name = ? AND barangay = ?";
                    PreparedStatement headCheckStmt = conn.prepareStatement(headCheckSql);
                    headCheckStmt.setString(1, committee.getHeadName());
                    headCheckStmt.setString(2, committee.getBarangay());
                    ResultSet existingHeadRs = headCheckStmt.executeQuery();
                    
                    if (existingHeadRs.next()) {
                        conn.rollback();
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

                // ✅ NEW: If head is assigned, add them as a committee member
                if (committee.getHeadName() != null && !committee.getHeadName().trim().isEmpty()) {
                    String insertMemberSql = "INSERT INTO CommitteeMembers (committee_name, barangay, councilor_name, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
                    PreparedStatement insertMemberStmt = conn.prepareStatement(insertMemberSql);
                    insertMemberStmt.setString(1, committee.getCommitteeName());
                    insertMemberStmt.setString(2, committee.getBarangay());
                    insertMemberStmt.setString(3, committee.getHeadName());
                    insertMemberStmt.executeUpdate();
                    System.out.println("Auto-added head as committee member during creation: " + committee.getHeadName());
                }

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
            return "ERROR";
        }
    }

    @PostMapping("/assignCommitteeHead")
    public String assignCommitteeHead(@RequestBody CommitteeMember committee) {
        try (Connection conn = dataSource.getConnection()) {
            // Start transaction
            conn.setAutoCommit(false);
            
            try {
                // 1. Check if committee exists in the barangay
                String committeeCheckSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
                PreparedStatement committeeCheckStmt = conn.prepareStatement(committeeCheckSql);
                committeeCheckStmt.setString(1, committee.getCommitteeName());
                committeeCheckStmt.setString(2, committee.getBarangay());
                ResultSet committeeRs = committeeCheckStmt.executeQuery();

                if (!committeeRs.next()) {
                    conn.rollback();
                    return "COMMITTEE_NOT_FOUND";
                }

                // 2. Check councilor exists, is approved, and is in the SAME barangay
                String verifySql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
                PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
                verifyStmt.setString(1, committee.getHeadName());
                verifyStmt.setString(2, committee.getBarangay());
                ResultSet rs = verifyStmt.executeQuery();

                if (!rs.next()) {
                    conn.rollback();
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
                    conn.rollback();
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
                    conn.rollback();
                    return "COMMITTEE_NOT_FOUND";
                }

                // 5. ✅ NEW: Add the head as a committee member (if not already a member)
                String memberCheckSql = "SELECT * FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? AND councilor_name = ?";
                PreparedStatement memberCheckStmt = conn.prepareStatement(memberCheckSql);
                memberCheckStmt.setString(1, committee.getCommitteeName());
                memberCheckStmt.setString(2, committee.getBarangay());
                memberCheckStmt.setString(3, committee.getHeadName());
                ResultSet memberRs = memberCheckStmt.executeQuery();
                
                if (!memberRs.next()) {
                    String insertMemberSql = "INSERT INTO CommitteeMembers (committee_name, barangay, councilor_name, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)";
                    PreparedStatement insertMemberStmt = conn.prepareStatement(insertMemberSql);
                    insertMemberStmt.setString(1, committee.getCommitteeName());
                    insertMemberStmt.setString(2, committee.getBarangay());
                    insertMemberStmt.setString(3, committee.getHeadName());
                    insertMemberStmt.executeUpdate();
                    System.out.println("Auto-added head as committee member: " + committee.getHeadName());
                }
                
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
            return "ERROR";
        }
    }

    @PostMapping("/addCommitteeMember")
    public String addCommitteeMember(@RequestBody CommitteeMember member) {
        try (Connection conn = dataSource.getConnection()) {
            String committeeCheckSql = "SELECT * FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement committeeCheckStmt = conn.prepareStatement(committeeCheckSql);
            committeeCheckStmt.setString(1, member.getCommitteeName());
            committeeCheckStmt.setString(2, member.getBarangay());
            ResultSet committeeRs = committeeCheckStmt.executeQuery();

            if (!committeeRs.next()) {
                return "COMMITTEE_NOT_FOUND";
            }

            String verifySql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ? AND approved = 1";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
            verifyStmt.setString(1, member.getCouncilorName());
            verifyStmt.setString(2, member.getBarangay());
            ResultSet rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "COUNCILOR_NOT_IN_BARANGAY";
            }

            String memberCheckSql = "SELECT * FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? AND councilor_name = ?";
            PreparedStatement memberCheckStmt = conn.prepareStatement(memberCheckSql);
            memberCheckStmt.setString(1, member.getCommitteeName());
            memberCheckStmt.setString(2, member.getBarangay());
            memberCheckStmt.setString(3, member.getCouncilorName());
            ResultSet memberRs = memberCheckStmt.executeQuery();

            if (memberRs.next()) {
                return "ALREADY_A_MEMBER";
            }

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
        try (Connection conn = dataSource.getConnection()) {
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

            String deleteSql = "DELETE FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? AND councilor_name = ?";
            PreparedStatement deleteStmt = conn.prepareStatement(deleteSql);
            deleteStmt.setString(1, member.getCommitteeName());
            deleteStmt.setString(2, member.getBarangay());
            deleteStmt.setString(3, member.getCouncilorName());
            int rows = deleteStmt.executeUpdate();

            return rows > 0 ? "SUCCESS" : "MEMBER_NOT_FOUND";
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @GetMapping("/getCommitteeMembers")
    public String getCommitteeMembers(@RequestParam String barangay, @RequestParam String committeeName) {
        try (Connection conn = dataSource.getConnection()) {
            String headSql = "SELECT head_name FROM Committees WHERE name = ? AND barangay = ?";
            PreparedStatement headStmt = conn.prepareStatement(headSql);
            headStmt.setString(1, committeeName);
            headStmt.setString(2, barangay);
            ResultSet headRs = headStmt.executeQuery();
            
            String headName = "";
            if (headRs.next() && headRs.getString("head_name") != null) {
                headName = headRs.getString("head_name");
            }

            String sql = "SELECT councilor_name, joined_at FROM CommitteeMembers WHERE committee_name = ? AND barangay = ? ORDER BY joined_at";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, committeeName);
            stmt.setString(2, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("{\"head\":\"").append(escape(headName)).append("\",\"members\":[");
            
            while (rs.next()) {
                result.append("{")
                      .append("\"name\":\"").append(escape(rs.getString("councilor_name"))).append("\",")
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
        try (Connection conn = dataSource.getConnection()) {
            String sql = "SELECT c.name, c.head_name, " +
                        "COALESCE((SELECT COUNT(*) FROM CommitteeMembers cm WHERE cm.committee_name = c.name AND cm.barangay = c.barangay), 0) as member_count " +
                        "FROM Committees c " +
                        "WHERE c.barangay = ?";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"committeeName\":\"").append(escape(rs.getString("name"))).append("\",")
                    .append("\"headName\":\"").append(escape(rs.getString("head_name") != null ? rs.getString("head_name") : "")).append("\",")
                    .append("\"memberCount\":").append(rs.getInt("member_count"))
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

    @GetMapping("/getMyCommittees")
    public String getMyCommittees(@RequestParam String barangay, @RequestParam String councilor) {
        try (Connection conn = dataSource.getConnection()) {
            
            String sql = "SELECT DISTINCT c.name as committee_name, c.head_name " +
                        "FROM Committees c " +
                        "LEFT JOIN CommitteeMembers cm ON cm.committee_name = c.name AND cm.barangay = c.barangay " +
                        "WHERE c.barangay = ? AND (c.head_name = ? OR cm.councilor_name = ?)";
            
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, barangay);
            stmt.setString(2, councilor);
            stmt.setString(3, councilor);
            ResultSet rs = stmt.executeQuery();
            
            StringBuilder result = new StringBuilder("[");
            while (rs.next()) {
                result.append("{")
                    .append("\"committeeName\":\"").append(escape(rs.getString("committee_name"))).append("\",")
                    .append("\"headName\":\"").append(escape(rs.getString("head_name") != null ? rs.getString("head_name") : "")).append("\"")
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

    @DeleteMapping("/deleteCommittee")
    public String deleteCommittee(@RequestBody Map<String, Object> request) {
        String committeeName = (String) request.get("committeeName");
        String barangay = (String) request.get("barangay");
        
        try (Connection conn = dataSource.getConnection()) {
            conn.setAutoCommit(false);
            try {
                String checkSql = "SELECT name FROM Committees WHERE name = ? AND barangay = ?";
                PreparedStatement checkStmt = conn.prepareStatement(checkSql);
                checkStmt.setString(1, committeeName);
                checkStmt.setString(2, barangay);
                ResultSet rs = checkStmt.executeQuery();
                
                if (!rs.next()) {
                    conn.rollback();
                    return "COMMITTEE_NOT_FOUND";
                }

                String deleteMembersSql = "DELETE FROM CommitteeMembers WHERE committee_name = ? AND barangay = ?";
                PreparedStatement deleteMembersStmt = conn.prepareStatement(deleteMembersSql);
                deleteMembersStmt.setString(1, committeeName);
                deleteMembersStmt.setString(2, barangay);
                int membersDeleted = deleteMembersStmt.executeUpdate();
                System.out.println("Deleted " + membersDeleted + " committee members");
                String deleteProjectsSql = "DELETE FROM Projects WHERE committee_name = ? AND barangay = ?";
                PreparedStatement deleteProjectsStmt = conn.prepareStatement(deleteProjectsSql);
                deleteProjectsStmt.setString(1, committeeName);
                deleteProjectsStmt.setString(2, barangay);
                int projectsDeleted = deleteProjectsStmt.executeUpdate();
                System.out.println("Deleted " + projectsDeleted + " projects");
                String deleteBudgetSql = "DELETE FROM CommitteeBudget WHERE committee_name = ? AND barangay = ?";
                PreparedStatement deleteBudgetStmt = conn.prepareStatement(deleteBudgetSql);
                deleteBudgetStmt.setString(1, committeeName);
                deleteBudgetStmt.setString(2, barangay);
                deleteBudgetStmt.executeUpdate();
                String deleteCommitteeSql = "DELETE FROM Committees WHERE name = ? AND barangay = ?";
                PreparedStatement deleteCommitteeStmt = conn.prepareStatement(deleteCommitteeSql);
                deleteCommitteeStmt.setString(1, committeeName);
                deleteCommitteeStmt.setString(2, barangay);
                int committeeDeleted = deleteCommitteeStmt.executeUpdate();
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

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}