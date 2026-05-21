package com.example.sklinaw.controller;

import java.util.HashMap;
import java.util.Map;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // Token storage (in production, use Redis or database)
    private static final Map<String, Map<String, Object>> activeTokens = new ConcurrentHashMap<>();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        try {
            String name = loginRequest.get("name");
            String password = loginRequest.get("password");
            
            System.out.println("Login attempt for user: " + name);
            
            String barangay = "";
            String privilege = "";
            int userId = 0;
            String userType = "";
            String storedPassword = "";
            
            try (Connection conn = dataSource.getConnection()) {
                // First, check Developer table
                String devSql = "SELECT id, name, password, privilege FROM Developer WHERE name = ? AND approved = 1";
                PreparedStatement devStmt = conn.prepareStatement(devSql);
                devStmt.setString(1, name);
                ResultSet devRs = devStmt.executeQuery();
                
                if (devRs.next()) {
                    userId = devRs.getInt("id");
                    storedPassword = devRs.getString("password");
                    privilege = devRs.getString("privilege") != null ? devRs.getString("privilege") : "ADMIN";
                    barangay = "System";
                    userType = "developer";
                    System.out.println("Found user in Developer table");
                } else {
                    // Check Councilors table
                    String councilorSql = "SELECT id, name, password, barangay, privilege FROM councilors WHERE name = ? AND approved = 1";
                    PreparedStatement councilorStmt = conn.prepareStatement(councilorSql);
                    councilorStmt.setString(1, name);
                    ResultSet councilorRs = councilorStmt.executeQuery();
                    
                    if (councilorRs.next()) {
                        userId = councilorRs.getInt("id");
                        storedPassword = councilorRs.getString("password");
                        barangay = councilorRs.getString("barangay");
                        privilege = councilorRs.getString("privilege") != null ? councilorRs.getString("privilege") : "";
                        userType = "councilor";
                        System.out.println("Found user in Councilors table");
                    } else {
                        return ResponseEntity.status(401).body(Map.of("status", "INVALID", "message", "User not found"));
                    }
                }
                
                // Verify password
                if (!passwordEncoder.matches(password, storedPassword)) {
                    return ResponseEntity.status(401).body(Map.of("status", "INVALID", "message", "Invalid credentials"));
                }
            }
            
            // Generate token
            String token = UUID.randomUUID().toString();
            
            // Store session data with token (expires in 24 hours)
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("userId", userId);
            sessionData.put("name", name);
            sessionData.put("barangay", barangay);
            sessionData.put("privilege", privilege);
            sessionData.put("userType", userType);
            sessionData.put("expiresAt", System.currentTimeMillis() + 24 * 60 * 60 * 1000); // 24 hours
            
            activeTokens.put(token, sessionData);
            
            System.out.println("Token created for user: " + name);
            System.out.println("Login successful for: " + name);
            
            // Return user data with token
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("status", "SUCCESS");
            responseData.put("name", name);
            responseData.put("barangay", barangay);
            responseData.put("privilege", privilege);
            responseData.put("id", String.valueOf(userId));
            responseData.put("userType", userType);
            responseData.put("token", token);
            
            return ResponseEntity.ok(responseData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            activeTokens.remove(token);
            System.out.println("Token removed for logout");
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuth(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.put("authenticated", false);
            response.put("message", "No token provided");
            return ResponseEntity.ok(response);
        }
        
        String token = authHeader.substring(7);
        Map<String, Object> sessionData = activeTokens.get(token);
        
        if (sessionData == null) {
            response.put("authenticated", false);
            response.put("message", "Invalid token");
            return ResponseEntity.ok(response);
        }
        
        long expiresAt = (long) sessionData.get("expiresAt");
        if (System.currentTimeMillis() > expiresAt) {
            activeTokens.remove(token);
            response.put("authenticated", false);
            response.put("message", "Token expired");
            return ResponseEntity.ok(response);
        }
        
        response.put("authenticated", true);
        response.put("name", sessionData.get("name"));
        response.put("userId", sessionData.get("userId"));
        response.put("barangay", sessionData.get("barangay"));
        response.put("privilege", sessionData.get("privilege"));
        response.put("userType", sessionData.get("userType"));
        
        return ResponseEntity.ok(response);
    }
}