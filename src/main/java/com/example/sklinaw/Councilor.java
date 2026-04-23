package com.example.sklinaw;

public class Councilor {
    private int id;
    private String name;
    private String password;
    private String barangay;
    private int approved;
    private String privilege;

    public Councilor() {}

    public Councilor(String name, String barangay) {
        this.name = name;
        this.barangay = barangay;
    }
    public int getId(){
        return id;
    }
    public void setId(int id){
        this.id = id;
    }
    public String getName(){
        return name;
    }
    public void setName(String name){
        this.name = name;
    }
    public String getPassword(){
        return password;
    }
    public void setPassword(String password){
        this.password = password;
    }
    public String getBarangay() {
        return barangay;
    }
    public void setBarangay(String barangay){
        this.barangay = barangay;
    }
    public int getApproved() {
        return approved;
    }
    public void setApproved(int approved) {
        this.approved = approved;
    }
    public String getPrivilege() {
        return privilege;
    }
    public void setPrivilege(String privilege) {
        this.privilege = privilege;
    }
    
}
