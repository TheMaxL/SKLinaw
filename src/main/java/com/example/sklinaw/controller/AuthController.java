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

import jakarta.servlet.http.HttpServletRequest;
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
                                    HttpServletRequest request) {
        try {
            String name = loginRequest.get("name");
            String password = loginRequest.get("password");
            
            System.out.println("Login attempt for user: " + name);
            
            // First, check if user exists and get their details
            String sql = "SELECT name, password, privilege, barangay, 'developer' as userType FROM Developer WHERE name = ? " +
                         "UNION ALL " +
                         "SELECT name, password, privilege, barangay, 'councilor' as userType FROM Councilors WHERE name = ?";
            
            Map<String, Object> userData = null;
            try (Connection conn = dataSource.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, name);
                stmt.setString(2, name);
                ResultSet rs = stmt.executeQuery();
                
                if (rs.next()) {
                    userData = new HashMap<>();
                    userData.put("name", rs.getString("name"));
                    userData.put("privilege", rs.getString("privilege"));
                    userData.put("barangay", rs.getString("barangay"));
                    userData.put("userType", rs.getString("userType"));
                    
                    String storedPassword = rs.getString("password");
                    
                    // Verify password
                    if (!passwordEncoder.matches(password, storedPassword)) {
                        return ResponseEntity.status(401).body(Map.of("status", "INVALID", "message", "Invalid credentials"));
                    }
                } else {
                    return ResponseEntity.status(401).body(Map.of("status", "INVALID", "message", "User not found"));
                }
            }
            
            // Authenticate with Spring Security
            UsernamePasswordAuthenticationToken authToken = 
                new UsernamePasswordAuthenticationToken(name, password);
            Authentication authentication = authenticationManager.authenticate(authToken);
            
            // Set the authentication in context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Force session creation
            HttpSession session = request.getSession(true);
            session.setAttribute("SPRING_SECURITY_CONTEXT", SecurityContextHolder.getContext());
            session.setMaxInactiveInterval(30 * 60); // 30 minutes
            
            System.out.println("Login successful for: " + name);
            System.out.println("Session ID: " + session.getId());
            System.out.println("User privilege: " + userData.get("privilege"));
            
            // Return user data
            return ResponseEntity.ok(userData);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(Map.of("status", "ERROR", "message", e.getMessage()));
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
        }
        
        return ResponseEntity.ok(response);
    }
}