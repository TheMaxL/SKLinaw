import javafx.application.Application;
import javafx.geometry.*;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.sql.*;

/**
 * SCRUM-7: Submit Credentials
 * Handles both SK Youth member registration and SK Official login.
 */
public class SubmitCredentials extends Application {

    private static final String DB_URL = "jdbc:sqlite:SKLinaw.db";

    // ─── DB Setup ────────────────────────────────────────────────────────────

    public static void initDB() {
        String createUsers = """
            CREATE TABLE IF NOT EXISTS users (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT    NOT NULL UNIQUE,
                password TEXT    NOT NULL,
                role     TEXT    NOT NULL DEFAULT 'youth',   -- 'youth' | 'sk_official'
                barangay TEXT,
                approved INTEGER NOT NULL DEFAULT 0           -- 0=pending, 1=approved
            );
        """;
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement  stmt = conn.createStatement()) {
            stmt.execute(createUsers);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    /**
     * Validates credentials for SK Official login.
     * @return the user row or null if invalid.
     */
    public static ResultSet loginUser(String username, String password) {
        String sql = "SELECT * FROM users WHERE username=? AND password=? AND role='sk_official'";
        try {
            Connection conn = DriverManager.getConnection(DB_URL);
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, username);
            ps.setString(2, password);   // ⚠️ Hash passwords in production (BCrypt)
            return ps.executeQuery();
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    // ─── Register ────────────────────────────────────────────────────────────

    /**
     * Registers a new SK Youth member (pending approval).
     * @return true if registered successfully.
     */
    public static boolean registerYouth(String username, String password, String barangay) {
        String sql = "INSERT INTO users (username, password, role, barangay, approved) VALUES (?,?,?,?,0)";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            ps.setString(2, password);   // ⚠️ Hash passwords in production (BCrypt)
            ps.setString(3, "youth");
            ps.setString(4, barangay);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            // Username already taken
            return false;
        }
    }

    // ─── JavaFX UI ───────────────────────────────────────────────────────────

    @Override
    public void start(Stage stage) {
        initDB();

        TabPane tabPane = new TabPane();
        tabPane.getTabs().addAll(buildLoginTab(stage), buildRegisterTab());

        Scene scene = new Scene(tabPane, 420, 380);
        stage.setTitle("SKLinaw – Submit Credentials");
        stage.setScene(scene);
        stage.show();
    }

    // --- Login Tab ---
    private Tab buildLoginTab(Stage stage) {
        Tab tab = new Tab("SK Official Login");
        tab.setClosable(false);

        GridPane grid = new GridPane();
        grid.setPadding(new Insets(30));
        grid.setHgap(12);
        grid.setVgap(14);
        grid.setAlignment(Pos.CENTER);

        Label titleLbl = new Label("SK Official Login");
        titleLbl.setStyle("-fx-font-size:18px; -fx-font-weight:bold;");

        TextField userField = new TextField();
        userField.setPromptText("Username");

        PasswordField passField = new PasswordField();
        passField.setPromptText("Password");

        Label msgLbl = new Label();
        msgLbl.setStyle("-fx-text-fill: red;");

        Button loginBtn = new Button("Log In");
        loginBtn.setDefaultButton(true);
        loginBtn.setMaxWidth(Double.MAX_VALUE);

        loginBtn.setOnAction(e -> {
            String user = userField.getText().trim();
            String pass = passField.getText().trim();
            if (user.isEmpty() || pass.isEmpty()) {
                msgLbl.setText("Please fill in all fields.");
                return;
            }
            try {
                ResultSet rs = loginUser(user, pass);
                if (rs != null && rs.next()) {
                    msgLbl.setStyle("-fx-text-fill: green;");
                    msgLbl.setText("Welcome, " + rs.getString("username") + "!");
                    // TODO: navigate to SK dashboard
                } else {
                    msgLbl.setStyle("-fx-text-fill: red;");
                    msgLbl.setText("Invalid username or password.");
                }
            } catch (SQLException ex) {
                msgLbl.setText("DB error: " + ex.getMessage());
            }
        });

        grid.add(titleLbl,  0, 0, 2, 1);
        grid.add(new Label("Username:"), 0, 1); grid.add(userField,  1, 1);
        grid.add(new Label("Password:"), 0, 2); grid.add(passField,  1, 2);
        grid.add(loginBtn,  0, 3, 2, 1);
        grid.add(msgLbl,    0, 4, 2, 1);

        tab.setContent(grid);
        return tab;
    }

    // --- Register Tab ---
    private Tab buildRegisterTab() {
        Tab tab = new Tab("Youth Registration");
        tab.setClosable(false);

        GridPane grid = new GridPane();
        grid.setPadding(new Insets(30));
        grid.setHgap(12);
        grid.setVgap(14);
        grid.setAlignment(Pos.CENTER);

        Label titleLbl = new Label("Register as SK Youth");
        titleLbl.setStyle("-fx-font-size:18px; -fx-font-weight:bold;");

        TextField userField = new TextField();
        userField.setPromptText("Username");

        PasswordField passField = new PasswordField();
        passField.setPromptText("Password");

        PasswordField confirmField = new PasswordField();
        confirmField.setPromptText("Confirm Password");

        // Barangay selector (reusing SelectBarangay logic)
        ComboBox<String> barangayBox = SelectBarangay.buildBarangayComboBox();
        barangayBox.setPromptText("Select Barangay");
        barangayBox.setMaxWidth(Double.MAX_VALUE);

        Label msgLbl = new Label();

        Button registerBtn = new Button("Register");
        registerBtn.setDefaultButton(true);
        registerBtn.setMaxWidth(Double.MAX_VALUE);

        registerBtn.setOnAction(e -> {
            String user  = userField.getText().trim();
            String pass  = passField.getText();
            String conf  = confirmField.getText();
            String brgy  = barangayBox.getValue();

            if (user.isEmpty() || pass.isEmpty() || brgy == null) {
                msgLbl.setStyle("-fx-text-fill: red;");
                msgLbl.setText("Please fill in all fields.");
                return;
            }
            if (!pass.equals(conf)) {
                msgLbl.setStyle("-fx-text-fill: red;");
                msgLbl.setText("Passwords do not match.");
                return;
            }
            boolean ok = registerYouth(user, pass, brgy);
            if (ok) {
                msgLbl.setStyle("-fx-text-fill: green;");
                msgLbl.setText("Registered! Waiting for SK approval.");
                userField.clear(); passField.clear(); confirmField.clear();
                barangayBox.setValue(null);
            } else {
                msgLbl.setStyle("-fx-text-fill: red;");
                msgLbl.setText("Username already taken.");
            }
        });

        grid.add(titleLbl,             0, 0, 2, 1);
        grid.add(new Label("Username:"),0, 1); grid.add(userField,    1, 1);
        grid.add(new Label("Password:"),0, 2); grid.add(passField,    1, 2);
        grid.add(new Label("Confirm:"), 0, 3); grid.add(confirmField, 1, 3);
        grid.add(new Label("Barangay:"),0, 4); grid.add(barangayBox,  1, 4);
        grid.add(registerBtn,          0, 5, 2, 1);
        grid.add(msgLbl,               0, 6, 2, 1);

        tab.setContent(grid);
        return tab;
    }

    public static void main(String[] args) { launch(args); }
}
