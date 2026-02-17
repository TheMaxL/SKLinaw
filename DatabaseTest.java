    import java.sql.Connection;
    import java.sql.DriverManager;
    import java.sql.PreparedStatement;
    import java.sql.SQLException;
    import java.util.Scanner;

    public class DatabaseTest {
        private static final String URL =
            "jdbc:sqlite:C:/Users/91460/.SKLinaw/SKLinaw/SKLinaw.db";

        public static void main(String[] args) {
            Scanner sc = new Scanner(System.in);
            int z = 1;
            while(z == 1){
                int y = sc.nextInt();
                switch (y) {
                    case 1:
                        try (Connection conn = DriverManager.getConnection(URL)) {
                            System.out.println("Select Barangay.");
                            String barangay = sc.nextLine();
                            System.out.println("Select City.");
                            String city = sc.nextLine();

                            String sql = "INSERT INTO Partners (Barangay, City) VALUES (?, ?)";
                            PreparedStatement pstmt = conn.prepareStatement(sql);
                            pstmt.setString(1, barangay);  
                            pstmt.setString(2, city);
                            pstmt.executeUpdate();


                        } catch (SQLException e) {
                            e.printStackTrace();
                        }
                    case 2:
                        try (Connection conn = DriverManager.getConnection(URL)) {
                            System.out.println("Give Profile.");
                            String name = sc.nextLine();
                            String password = sc.nextLine();
                            String barangay = sc.nextLine();

                            String sql = "INSERT INTO Councilors (Name, Password, Barangay) VALUES (?, ?, ?)";
                            PreparedStatement pstmt = conn.prepareStatement(sql);
                            pstmt.setString(1, name);  
                            pstmt.setString(2, password);
                            pstmt.setString(3, barangay);
                            pstmt.executeUpdate();


                        } catch (SQLException e) {
                            e.printStackTrace();
                        }
                    case 3:
                        return;
                    default:
                        System.out.println("Invalid choice.");
                }

            }

            sc.close();

        }
    }
