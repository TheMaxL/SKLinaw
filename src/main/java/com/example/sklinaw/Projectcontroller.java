package com.example.sklinaw;

public class Projectcontroller {
    private String projectName;
    private String purpose;
    private String committeeName;
    private String barangay;
    private String councilorName;
    private double totalCost;

    public String getProjectName() { return projectName; }
    public String getPurpose() { return purpose; }
    public String getCommitteeName() { return committeeName; }
    public String getBarangay() { return barangay; }
    public String getCouncilorName() { return councilorName; }
    public double getTotalCost() { return totalCost; }

    public void setProjectName(String projectName) { this.projectName = projectName; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public void setCommitteeName(String committeeName) { this.committeeName = committeeName; }
    public void setBarangay(String barangay) { this.barangay = barangay; }
    public void setCouncilorName(String councilorName) { this.councilorName = councilorName; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }
}
