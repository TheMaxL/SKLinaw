package com.example.sklinaw;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin

public class Controller {
    private static final String URL = "jdbc:sqlite:SKLinaw.db";

    @PostMapping("/addAccount")
    public String addAccount(@RequestBody Account account) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1️⃣ Check if name + barangay exists in VERIFIED table
            String verifySql = "SELECT * FROM verified WHERE Name = ? AND Barangay = ?";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);

            verifyStmt.setString(1, account.getName());
            verifyStmt.setString(2, account.getBarangay());

            var rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                // ❌ Not found in verified table
                return "NOT_VERIFIED";
            }

            // 2️⃣ Optional: Check if account already exists
            String checkExisting = "SELECT * FROM Councilors WHERE Name = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkExisting);
            checkStmt.setString(1, account.getName());

            var existingRs = checkStmt.executeQuery();

            if (existingRs.next()) {
                return "ALREADY_EXISTS";
            }

            // 3️⃣ Insert into Councilors
            String insertSql = "INSERT INTO Councilors (Name, Password, Barangay) VALUES (?, ?, ?)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);

            insertStmt.setString(1, account.getName());
            insertStmt.setString(2, account.getPassword());
            insertStmt.setString(3, account.getBarangay());

            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
    @PostMapping("/login")
    public String login(@RequestBody Account account) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql = "SELECT * FROM Councilors WHERE Name = ? AND Password = ?";
            PreparedStatement pstmt = conn.prepareStatement(sql);

            pstmt.setString(1, account.getName());
            pstmt.setString(2, account.getPassword());

            var rs = pstmt.executeQuery();

            if (rs.next()) {
                return "SUCCESS";
            } else {
                return "INVALID";
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
}
