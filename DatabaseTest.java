    import java.sql.Connection;
    import java.sql.DriverManager;
    import java.sql.PreparedStatement;
    import java.sql.SQLException;
    import java.util.Scanner;

    public class DatabaseTest {
        private static final String URL =
            "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

        public static void main(String[] args) {

            try (Connection conn = DriverManager.getConnection(URL)) {
                System.out.println("Connected successfully!");
                Scanner sc = new Scanner(System.in);
            String name = sc.nextLine();
            String barangay = sc.nextLine();

            String sql = "INSERT INTO Councilors (Name, Barangay) VALUES (?, ?)";
            PreparedStatement pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, name);  
            pstmt.setString(2, barangay); 
            pstmt.executeUpdate();


            } catch (SQLException e) {
                e.printStackTrace();
            }

        }
    }
