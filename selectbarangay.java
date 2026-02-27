import javafx.collections.*;
import javafx.geometry.*;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.Stage;

import java.sql.*;

/**
 * SCRUM-14: Select Barangay
 * Provides a ComboBox of barangays (loaded from DB or a default list).
 * Can be used standalone or embedded inside SubmitCredentials.
 */
public class SelectBarangay {

    private static final String DB_URL = "jdbc:sqlite:SKLinaw.db";

    // ─── Default Barangay List (replace with your actual municipality's list) ─

    private static final String[] DEFAULT_BARANGAYS = {
        "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4",
        "Barangay 5", "Barangay 6", "Barangay 7", "Barangay 8",
        "Poblacion", "San Jose", "Santa Cruz", "Gorordo",
        "Lahug", "Ramos", "V Rama", "etc"
    };

    // ─── DB Setup ────────────────────────────────────────────────────────────

    public static void initBarangayTable() {
        String createTable = """
            CREATE TABLE IF NOT EXISTS barangays (
                id   INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
        """;
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement()) {
            stmt.execute(createTable);

            // Seed defaults if table is empty
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM barangays");
            if (rs.next() && rs.getInt(1) == 0) {
                for (String b : DEFAULT_BARANGAYS) {
                    stmt.execute("INSERT OR IGNORE INTO barangays (name) VALUES ('" + b + "')");
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // ─── Load Barangays from DB ───────────────────────────────────────────────

    public static ObservableList<String> loadBarangays() {
        ObservableList<String> list = FXCollections.observableArrayList();
        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT name FROM barangays ORDER BY name")) {
            while (rs.next()) {
                list.add(rs.getString("name"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
            // Fallback to hardcoded list
            list.addAll(DEFAULT_BARANGAYS);
        }
        return list;
    }

    // ─── Build ComboBox (reusable) ────────────────────────────────────────────

    /**
     * Returns a ready-to-use ComboBox populated with barangays.
     * Reused by SubmitCredentials and any other screen that needs it.
     */
    public static ComboBox<String> buildBarangayComboBox() {
        initBarangayTable();
        ComboBox<String> combo = new ComboBox<>(loadBarangays());
        combo.setPromptText("Select Barangay");
        combo.setPrefWidth(200);

        // Add search/filter capability
        combo.setEditable(true);
        ObservableList<String> allItems = combo.getItems();
        combo.getEditor().textProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal == null || newVal.isEmpty()) {
                combo.setItems(allItems);
            } else {
                ObservableList<String> filtered = FXCollections.observableArrayList();
                for (String item : allItems) {
                    if (item.toLowerCase().contains(newVal.toLowerCase())) {
                        filtered.add(item);
                    }
                }
                combo.setItems(filtered);
            }
        });

        return combo;
    }

    // ─── Standalone UI (for testing) ─────────────────────────────────────────

    public static void showStandalone(Stage stage) {
        ComboBox<String> barangayBox = buildBarangayComboBox();
        Label selectedLbl = new Label("No barangay selected.");
        Button confirmBtn = new Button("Confirm");

        confirmBtn.setOnAction(e -> {
            String selected = barangayBox.getValue();
            if (selected == null || selected.trim().isEmpty()) {
                selectedLbl.setText("⚠ Please select a barangay.");
                selectedLbl.setStyle("-fx-text-fill: red;");
            } else {
                selectedLbl.setText("✔ Selected: " + selected);
                selectedLbl.setStyle("-fx-text-fill: green;");
            }
        });

        VBox root = new VBox(14,
            new Label("Select Your Barangay"),
            barangayBox,
            confirmBtn,
            selectedLbl
        );
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER_LEFT);

        stage.setTitle("SKLinaw – Select Barangay");
        stage.setScene(new Scene(root, 320, 200));
        stage.show();
    }
}
