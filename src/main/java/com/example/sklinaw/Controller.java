package com.example.sklinaw;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin

public class Controller {
    private static final String URL = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

    @PostMapping("/addAccount")
    public String addAccount(@RequestBody Account account) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1️⃣ Check if name + barangay exists in VERIFIED table
            String verifySql = "SELECT * FROM Verified WHERE Name = ? AND Barangay = ?";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);

            verifyStmt.setString(1, account.getName());
            verifyStmt.setString(2, account.getBarangay());

            var rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "NOT_VERIFIED";
            }

            // 2️⃣ Optional: Check if account already exists
            String checkExisting = "SELECT * FROM Councilors WHERE Name = ? and Barangay =?";
            PreparedStatement checkStmt = conn.prepareStatement(checkExisting);
            checkStmt.setString(1, account.getName());

            var existingRs = checkStmt.executeQuery();

            if (existingRs.next()) {
                return "ALREADY_EXISTS";
            }

            // 3️⃣ Insert into Councilors
            String insertSql = "INSERT INTO Councilors (Name, Password, Barangay, approved) VALUES (?, ?, ?, 0)";
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

            String sql = "SELECT * FROM Councilors WHERE Name = ? AND Password = ? AND approved = 1";
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
    @PostMapping("/submitCredentials")
    public String submitCredentials(
            @RequestParam("name") String name,
            @RequestParam("password") String password,
            @RequestParam("barangay") String barangay,
            @RequestParam("photo") MultipartFile photo
    ) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // Save photo
            String fileName = photo.getOriginalFilename();
            String uploadDir = "C:/Users/91460/.SKLinaw/uploads/";

            File file = new File(uploadDir + fileName);
            photo.transferTo(file);

            // Insert into pending accounts
            String sql = "INSERT INTO PendingAccounts (Name,Password,Barangay,Photo) VALUES (?,?,?,?)";
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setString(1, name);
            stmt.setString(2, password);
            stmt.setString(3, barangay);
            stmt.setString(4, fileName);

            stmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }
}

