package com.example.sklinaw;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // CREATE ACCOUNT (Direct creation)
    @PostMapping("/addAccount")
    public String addAccount(@RequestBody Account account) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1️⃣ Check if name + barangay exists in VERIFIED table
            String verifySql = "SELECT * FROM Verified WHERE Name = ? AND Barangay = ?";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);

            verifyStmt.setString(1, account.getName());
            verifyStmt.setString(2, account.getBarangay());

            ResultSet rs = verifyStmt.executeQuery();

            if (!rs.next()) {
                return "NOT_VERIFIED";
            }

            // 2️⃣ Check if account already exists
            String checkExisting = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkExisting);

            checkStmt.setString(1, account.getName());
            checkStmt.setString(2, account.getBarangay());

            ResultSet existingRs = checkStmt.executeQuery();

            if (existingRs.next()) {
                return "ALREADY_EXISTS";
            }

            // 3️⃣ Hash password
            String hashedPassword = encoder.encode(account.getPassword());

            // 4️⃣ Insert into Councilors
            String insertSql = "INSERT INTO Councilors (Name, Password, Barangay, approved) VALUES (?, ?, ?, 0)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);

            insertStmt.setString(1, account.getName());
            insertStmt.setString(2, hashedPassword);
            insertStmt.setString(3, account.getBarangay());

            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    // LOGIN
    @PostMapping("/login")
public Map<String, String> login(@RequestBody Account account) {
    Map<String, String> response = new HashMap<>();
    
    try (Connection conn = DriverManager.getConnection(URL)) {
        String sql = "SELECT * FROM Councilors WHERE Name = ? AND approved = 1";
        PreparedStatement pstmt = conn.prepareStatement(sql);
        pstmt.setString(1, account.getName());
        ResultSet rs = pstmt.executeQuery();
        
        if (rs.next()) {
            String storedHash = rs.getString("Password");
            if (encoder.matches(account.getPassword(), storedHash)) {
                response.put("status", "SUCCESS");
                response.put("barangay", rs.getString("Barangay"));  
                response.put("name", rs.getString("Name"));
                return response;
            }
        }
        
        response.put("status", "INVALID");
        return response;
        
    } catch (Exception e) {
        e.printStackTrace();
        response.put("status", "ERROR");
        return response;
    }
}

    // SUBMIT CREDENTIALS WITH PHOTO
    @PostMapping("/submitCredentials")
    public String submitCredentials(
            @RequestParam("name") String name,
            @RequestParam("password") String password,
            @RequestParam("barangay") String barangay,
            @RequestParam("photo") MultipartFile photo
    ) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            // 1️⃣ Hash password
            String hashedPassword = encoder.encode(password);

            // 2️⃣ Save uploaded photo
            String fileName = System.currentTimeMillis() + "_" + photo.getOriginalFilename();
            String uploadDir = "C:/Users/91460/.SKLinaw/uploads/";

            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File file = new File(dir, fileName);
            photo.transferTo(file);

            // 3️⃣ Insert into PendingAccounts
            String sql = "INSERT INTO PendingAccounts (Name, Password, Barangay, Photo) VALUES (?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);

            stmt.setString(1, name);
            stmt.setString(2, hashedPassword);
            stmt.setString(3, barangay);
            stmt.setString(4, fileName);

            stmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    @PostMapping("/getUserInfo")
    public Map<String, String> getUserInfo(@RequestBody Map<String, String> request) {
        Map<String, String> response = new HashMap<>();
        
        try (Connection conn = DriverManager.getConnection(URL)) {
            String name = request.get("name");
            String barangay = request.get("barangay");
            
            String sql = "SELECT Name, Barangay, approved FROM Councilors WHERE Name = ? AND Barangay = ?";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);
            pstmt.setString(2, barangay);
            
            ResultSet rs = pstmt.executeQuery();
            
            if (rs.next()) {
                response.put("name", rs.getString("Name"));
                response.put("barangay", rs.getString("Barangay"));
                response.put("role", "SK Councilor");
                response.put("status", "approved");
            } else {
                response.put("name", name);
                response.put("role", "Councilor");
                response.put("status", "pending");
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", e.getMessage());
        }
        
        return response;
    }

}