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
import org.springframework.web.bind.annotation.RequestMapping;
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
}