package com.example.sklinaw;

import java.util.Map;

public class Budget {
    private String barangay;
    private double totalBudget;
    // Key = committee name, Value = amount allocated
    private Map<String, Double> allocations;

    public String getBarangay() { return barangay; }
    public double getTotalBudget() { return totalBudget; }
    public Map<String, Double> getAllocations() { return allocations; }

    public void setBarangay(String barangay) { this.barangay = barangay; }
    public void setTotalBudget(double totalBudget) { this.totalBudget = totalBudget; }
    public void setAllocations(Map<String, Double> allocations) { this.allocations = allocations; }
}
