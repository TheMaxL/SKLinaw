package com.example.sklinaw;

public class Account {
    private int id;             
    private String name;
    private String password;
    private String barangay;
    private int approved;      
    private String privilege;    
    
    // Constructors
    public Account() {}
    
    public Account(String name, String barangay) {
        this.name = name;
        this.barangay = barangay;
    }
    
    // Getters
    public int getId() { return id; }
    public String getName() { return name; }
    public String getPassword() { return password; }
    public String getBarangay() { return barangay; }
    public int getApproved() { return approved; }
    public String getPrivilege() { return privilege; }
    
    // Setters
    public void setId(int id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setPassword(String password) { this.password = password; }
    public void setBarangay(String barangay) { this.barangay = barangay; }
    public void setApproved(int approved) { this.approved = approved; }
    public void setPrivilege(String privilege) { this.privilege = privilege; }
    
    // Helper methods
    public boolean isApproved() { return approved == 1; }
    public boolean isChairman() { return "CHAIRMAN".equals(privilege); }
    public boolean isTreasurer() { return "TREASURER".equals(privilege); }
    public boolean isAdmin() { return "ADMIN".equals(privilege); }
}