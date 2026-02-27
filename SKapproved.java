import javafx.application.Application;
import javafx.collections.*;
import javafx.geometry.*;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.sql.*;

/**
 * SCRUM-12: SK Approved
 * Admin screen for SK Officials to approve or reject pending youth registrations.
 */
public class SKApproved extends Application {

    private static final String DB_URL = "jdbc:sqlite:SKLinaw.db";

    // ─── Model ───────────────────────────────────────────────────────────────

    public static class UserRow {
        private final int    id;
        private final String username;
        private final String barangay;
        private final String status;

        public UserRow(int id, String username, String barangay, int approved) {
            this.id       = id;
            this.username = username;
            this.barangay = barangay;
            this.status   = approved == 1 ? "Approved" : approved == 2 ? "Rejected" : "Pending";
        }

        public int    getId()       { return id; }
        public String getUsername() { return username; }
        public String getBarangay() { return barangay; }
        public String getStatus()   { return status; }
    }

    // ─── DB Helpers ──────────────────────────────────────────────────────────

    private ObservableList<UserRow> loadPendingUsers() {
        ObservableList<UserRow> list = FXCollections.observableArrayList();
        String sql = "SELECT id, username, barangay, approved FROM users WHERE role='youth'";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt  = conn.createStatement();
             ResultSet rs    = stmt.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new UserRow(
                    rs.getInt("id"),
                    rs.getString("username"),
                    rs.getString("barangay"),
                    rs.getInt("approved")
                ));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    private boolean setApproval(int userId, int approvedValue) {
        // approvedValue: 1 = approved, 2 = rejected
        String sql = "UPDATE users SET approved=? WHERE id=?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, approvedValue);
            ps.setInt(2, userId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    // ─── UI ──────────────────────────────────────────────────────────────────

    @Override
    public void start(Stage stage) {
        // ── Table ──
        TableView<UserRow> table = new TableView<>();
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        TableColumn<UserRow, Integer> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(new PropertyValueFactory<>("id"));
        idCol.setMaxWidth(50);

        TableColumn<UserRow, String> userCol = new TableColumn<>("Username");
        userCol.setCellValueFactory(new PropertyValueFactory<>("username"));

        TableColumn<UserRow, String> brgyCol = new TableColumn<>("Barangay");
        brgyCol.setCellValueFactory(new PropertyValueFactory<>("barangay"));

        TableColumn<UserRow, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));

        table.getColumns().addAll(idCol, userCol, brgyCol, statusCol);
        table.setItems(loadPendingUsers());
        table.setPlaceholder(new Label("No registered users found."));

        // ── Buttons ──
        Button approveBtn = new Button("✔ Approve");
        approveBtn.setStyle("-fx-background-color: #4CAF50; -fx-text-fill: white; -fx-font-weight: bold;");

        Button rejectBtn = new Button("✘ Reject");
        rejectBtn.setStyle("-fx-background-color: #f44336; -fx-text-fill: white; -fx-font-weight: bold;");

        Button refreshBtn = new Button("⟳ Refresh");

        Label statusLbl = new Label();

        approveBtn.setOnAction(e -> {
            UserRow selected = table.getSelectionModel().getSelectedItem();
            if (selected == null) {
                statusLbl.setStyle("-fx-text-fill: red;");
                statusLbl.setText("Select a user first.");
                return;
            }
            if (setApproval(selected.getId(), 1)) {
                statusLbl.setStyle("-fx-text-fill: green;");
                statusLbl.setText("✔ " + selected.getUsername() + " has been approved.");
                table.setItems(loadPendingUsers());
            }
        });

        rejectBtn.setOnAction(e -> {
            UserRow selected = table.getSelectionModel().getSelectedItem();
            if (selected == null) {
                statusLbl.setStyle("-fx-text-fill: red;");
                statusLbl.setText("Select a user first.");
                return;
            }
            if (setApproval(selected.getId(), 2)) {
                statusLbl.setStyle("-fx-text-fill: darkorange;");
                statusLbl.setText("✘ " + selected.getUsername() + " has been rejected.");
                table.setItems(loadPendingUsers());
            }
        });

        refreshBtn.setOnAction(e -> {
            table.setItems(loadPendingUsers());
            statusLbl.setText("List refreshed.");
        });

        // ── Filter by status ──
        ComboBox<String> filterBox = new ComboBox<>(
            FXCollections.observableArrayList("All", "Pending", "Approved", "Rejected")
        );
        filterBox.setValue("All");
        filterBox.setOnAction(e -> {
            String filter = filterBox.getValue();
            if ("All".equals(filter)) {
                table.setItems(loadPendingUsers());
            } else {
                ObservableList<UserRow> filtered = FXCollections.observableArrayList();
                for (UserRow r : loadPendingUsers()) {
                    if (r.getStatus().equals(filter)) filtered.add(r);
                }
                table.setItems(filtered);
            }
        });

        // ── Layout ──
        Label titleLbl = new Label("SK Approval Management");
        titleLbl.setStyle("-fx-font-size:18px; -fx-font-weight:bold;");

        HBox filterRow = new HBox(10, new Label("Filter by status:"), filterBox, refreshBtn);
        filterRow.setAlignment(Pos.CENTER_LEFT);

        HBox btnRow = new HBox(12, approveBtn, rejectBtn);
        btnRow.setAlignment(Pos.CENTER_LEFT);

        VBox root = new VBox(14, titleLbl, filterRow, table, btnRow, statusLbl);
        root.setPadding(new Insets(24));
        VBox.setVgrow(table, Priority.ALWAYS);

        Scene scene = new Scene(root, 620, 450);
        stage.setTitle("SKLinaw – SK Approval");
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) { launch(args); }
}
