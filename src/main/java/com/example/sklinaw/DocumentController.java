package com.example.sklinaw;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class DocumentController {

    private static final String URL        = "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";
    private static final String UPLOAD_DIR = "C:/Users/91460/.SKLinaw/uploads/documents/";

    
    @PostMapping("/uploadProjectDocument")
    public String uploadProjectDocument(
            @RequestParam("projectId") int projectId,
            @RequestParam("barangay")  String barangay,
            @RequestParam("file")      MultipartFile file) {

        try (Connection conn = DriverManager.getConnection(URL)) {

            
            String checkSql = "SELECT id FROM Projects WHERE id = ? AND barangay = ?";
            PreparedStatement checkStmt = conn.prepareStatement(checkSql);
            checkStmt.setInt(1, projectId);
            checkStmt.setString(2, barangay);
            ResultSet rs = checkStmt.executeQuery();
            if (!rs.next()) return "PROJECT_NOT_FOUND";

            
            String originalName = file.getOriginalFilename();
            if (originalName == null) return "INVALID_FILE";

            String lowerName = originalName.toLowerCase();
            String fileType;
            if (lowerName.endsWith(".pdf")) {
                fileType = "pdf";
            } else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")
                    || lowerName.endsWith(".png") || lowerName.endsWith(".webp")) {
                fileType = "image";
            } else {
                return "UNSUPPORTED_FILE_TYPE";
            }

            
            
            String savedName = "proj_" + projectId + "_" + System.currentTimeMillis() + "_" + originalName;
            File uploadDir = new File(UPLOAD_DIR);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            File dest = new File(UPLOAD_DIR + savedName);
            file.transferTo(dest);

            
            String insertSql =
                "INSERT INTO ProjectDocuments (project_id, barangay, file_name, file_type, file_path) " +
                "VALUES (?, ?, ?, ?, ?)";
            PreparedStatement insertStmt = conn.prepareStatement(insertSql);
            insertStmt.setInt(1, projectId);
            insertStmt.setString(2, barangay);
            insertStmt.setString(3, originalName);
            insertStmt.setString(4, fileType);
            insertStmt.setString(5, savedName);
            insertStmt.executeUpdate();

            return "SUCCESS";

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    
    @GetMapping("/getProjectDocuments")
    public String getProjectDocuments(@RequestParam int projectId) {
        try (Connection conn = DriverManager.getConnection(URL)) {

            String sql =
                "SELECT id, file_name, file_type, file_path, uploaded_at " +
                "FROM ProjectDocuments WHERE project_id = ? ORDER BY uploaded_at ASC";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, projectId);
            ResultSet rs = stmt.executeQuery();

            StringBuilder result = new StringBuilder("[");
            boolean first = true;
            while (rs.next()) {
                if (!first) result.append(",");
                String filePath = rs.getString("file_path");
                result.append("{")
                      .append("\"id\":").append(rs.getInt("id")).append(",")
                      .append("\"fileName\":\"").append(escape(rs.getString("file_name"))).append("\",")
                      .append("\"fileType\":\"").append(escape(rs.getString("file_type"))).append("\",")
                      
                      .append("\"url\":\"/documents/").append(escape(filePath)).append("\",")
                      .append("\"uploadedAt\":\"").append(escape(rs.getString("uploaded_at"))).append("\"")
                      .append("}");
                first = false;
            }
            result.append("]");
            return result.toString();

        } catch (Exception e) {
            e.printStackTrace();
            return "ERROR";
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n");
    }
}