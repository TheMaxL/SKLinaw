package com.example.sklinaw.controller;

import java.util.HashMap;
import java.util.Map;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.Cookie;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest, 
                                    HttpServletRequest request, 
                                    HttpServletResponse response) {
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
            
            // ✅ CRITICAL: Create session and set cookie
            HttpSession session = request.getSession(true); // true = create if doesn't exist
            session.setAttribute("userId", userId);
            session.setAttribute("name", name);
            session.setAttribute("barangay", barangay);
            session.setAttribute("privilege", privilege);
            session.setAttribute("userType", userType);
            session.setMaxInactiveInterval(30 * 60); // 30 minutes
            
            // ✅ CRITICAL: Set session cookie in response
            Cookie sessionCookie = new Cookie("JSESSIONID", session.getId());
            sessionCookie.setPath("/");
            sessionCookie.setHttpOnly(true);
            sessionCookie.setSecure(true);  // Required for HTTPS
            sessionCookie.setAttribute("SameSite", "None");  // Required for cross-domain
            response.addCookie(sessionCookie);
            
            // Also set the header explicitly
            response.setHeader("Set-Cookie", 
                "JSESSIONID=" + session.getId() + 
                "; Path=/; HttpOnly; Secure; SameSite=None");
            
            System.out.println("Session created with ID: " + session.getId());
            System.out.println("Login successful for: " + name);
            
            // Return user data
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("status", "SUCCESS");
            responseData.put("name", name);
            responseData.put("barangay", barangay);
            responseData.put("privilege", privilege);
            responseData.put("id", String.valueOf(userId));
            responseData.put("userType", userType);
            
            return ResponseEntity.ok(responseData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuth(Authentication authentication, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        HttpSession session = request.getSession(false);
        response.put("hasSession", session != null);
        
        if (authentication == null || !authentication.isAuthenticated()) {
            response.put("authenticated", false);
            return ResponseEntity.ok(response);
        }
        
        response.put("authenticated", true);
        response.put("name", authentication.getName());
        response.put("authorities", authentication.getAuthorities().stream()
            .map(a -> a.getAuthority())
            .toList());
        
        if (session != null) {
            response.put("sessionId", session.getId());
            // Also return stored session attributes if needed
            if (session.getAttribute("userType") != null) {
                response.put("userType", session.getAttribute("userType"));
                response.put("barangay", session.getAttribute("barangay"));
                response.put("privilege", session.getAttribute("privilege"));
            }
        }
        
        return ResponseEntity.ok(response);
    }
}