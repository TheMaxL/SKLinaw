package com.example.sklinaw;

public class CommitteeMember {
    private String committeeName;           // Committee name (for head assignment)
    private String barangay;
    private String headName;       // For assigning committee head
    private String councilorName;  // For adding/removing members
    private String joinedAt;

    // Constructors
    public CommitteeMember() {}

    // Getters
    public String getCommitteeName() {return committeeName; }
    public String getBarangay() { return barangay; }
    public String getHeadName() { return headName; }
    public String getCouncilorName() { return councilorName; }
    public String getJoinedAt() { return joinedAt; }

    // Setters
    public void setCommitteeName(String committeeName) { this.committeeName = committeeName; }
    public void setBarangay(String barangay) { this.barangay = barangay; }
    public void setHeadName(String headName) { this.headName = headName; }
    public void setCouncilorName(String councilorName) { this.councilorName = councilorName; }
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }
}