package com.example.sklinaw.controller;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.sklinaw.model.Account;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
@CrossOrigin(
    origins = {
        "http://localhost:8085",
        "http://localhost:3000",
        "https://sklinaw.vercel.app",
        "https://*.vercel.app",
        "https://sklinaw.onrender.com",
        "https://*.onrender.com"
    },
    allowCredentials = "true"
)
public class Controller {
    @Autowired
    private DataSource dataSource;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Autowired
    private AuthenticationManager authenticationManager;

    // =========================
    // CREATE ACCOUNT
    // =========================
    @PostMapping("/addAccount")
    public String addAccount(@RequestBody Account account) {
        try (Connection conn = dataSource.getConnection()) {

            String verifySql = "SELECT * FROM Verified WHERE Name = ? AND Barangay = ?";
            PreparedStatement verifyStmt = conn.prepareStatement(verifySql);
            verifyStmt.setString(1, account.getName());
            verifyStmt.setString(2, account.getBarangay());

            ResultSet rs = verifyStmt.executeQuery();
            if (!rs.next()) return "NOT_VERIFIED";

            String checkExisting = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkExisting);
            checkStmt.setString(1, account.getName());
            checkStmt.setString(2, account.getBarangay());

            ResultSet existingRs = checkStmt.executeQuery();
            if (existingRs.next()) return "ALREADY_EXISTS";

            String hashedPassword = encoder.encode(account.getPassword());

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

    // =========================
    // SUBMIT CREDENTIALS
    // =========================
    @PostMapping("/submitCredentials")
    public String submitCredentials(
            @RequestParam("name") String name,
            @RequestParam("password") String password,
            @RequestParam("barangay") String barangay,
            @RequestParam("photo") MultipartFile photo
    ) {
        try (Connection conn = dataSource.getConnection()) {
            
            // Check if already exists
            String checkSql = "SELECT * FROM Councilors WHERE Name = ? AND Barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setString(1, name);
            checkStmt.setString(2, barangay);
            ResultSet rs = checkStmt.executeQuery();
            
            if (rs.next()) {
                return "ALREADY_EXISTS";
            }
            
            String hashedPassword = encoder.encode(password);
            
            // Insert with photo data as byte array
            String sql = "INSERT INTO PendingAccounts (Name, Password, Barangay, Photo, photo_data, photo_content_type, photo_filename) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, name);
            stmt.setString(2, hashedPassword);
            stmt.setString(3, barangay);
            stmt.setString(4, photo.getOriginalFilename()); 
            stmt.setBytes(5, photo.getBytes()); 
            stmt.setString(6, photo.getContentType()); 
            stmt.setString(7, photo.getOriginalFilename());
            
            stmt.executeUpdate();
            return "SUCCESS";
            
        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR: " + e.getMessage();
        }
    }

    @PostMapping("/getUserInfo")
    public Map<String, String> getUserInfo(@RequestBody Map<String, String> request) {
        Map<String, String> response = new HashMap<>();

        try (Connection conn = dataSource.getConnection()) {
            String name = request.get("name");
            String barangay = request.get("barangay");

            String sql = "SELECT Name, Barangay, approved, privilege FROM Councilors WHERE Name = ? AND Barangay = ?";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);
            pstmt.setString(2, barangay);

            ResultSet rs = pstmt.executeQuery();

            if (rs.next()) {
                response.put("name", rs.getString("Name"));
                response.put("barangay", rs.getString("Barangay"));
                response.put("privilege", rs.getString("privilege") != null ? rs.getString("privilege") : "");
                response.put("role", getRoleDisplay(rs.getString("privilege")));
                response.put("status", "approved");
            } else {
                response.put("name", name);
                response.put("role", "Councilor");
                response.put("status", "pending");
                response.put("privilege", "");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", e.getMessage());
        }

        return response;
    }

    @GetMapping("/check-role")
    public Map<String, Object> checkRole(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication == null) {
            response.put("authenticated", false);
            return response;
        }
        
        response.put("authenticated", true);
        response.put("name", authentication.getName());
        response.put("authorities", authentication.getAuthorities().toString());
        
        return response;
    }

    @GetMapping("/councilors")
    public List<Account> getAllCouncilors() {
        String sql = "SELECT id, Name, Barangay, approved, privilege FROM Councilors WHERE approved = 1";
        
        try (Connection conn = DriverManager.getConnection(dbUrl);
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            ResultSet rs = pstmt.executeQuery();
            List<Account> councilors = new ArrayList<>();
            
            while (rs.next()) {
                Account account = new Account();
                account.setId(rs.getInt("id"));
                account.setName(rs.getString("Name"));
                account.setBarangay(rs.getString("Barangay"));
                account.setApproved(rs.getInt("approved"));
                account.setPrivilege(rs.getString("privilege"));
                councilors.add(account);
            }
            return councilors;
            
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @GetMapping("/check-session")
    public ResponseEntity<?> checkSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).body(Map.of("authenticated", false));
        }
        return ResponseEntity.ok(Map.of("authenticated", true));
    }

    private String getRoleDisplay(String privilege) {
        if (privilege == null) return "Councilor";

        switch (privilege) {
            case "ADMIN": return "Administrator";
            case "CHAIRMAN": return "Chairman";
            case "TREASURER": return "Treasurer";
            case "DEVELOPER": return "Developer";
            default: return "Councilor";
        }
    }
}