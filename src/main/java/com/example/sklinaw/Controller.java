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

            String sql = "INSERT INTO Councilors (Name, Password, Barangay) VALUES (?, ?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(sql);

            pstmt.setString(1, account.getName());
            pstmt.setString(2, account.getPassword());
            pstmt.setString(3, account.getBarangay());

            pstmt.executeUpdate();

        } catch (Exception e) {
            e.printStackTrace();
            return "Error saving account.";
        }

        return "Account saved successfully!";
    }
}
