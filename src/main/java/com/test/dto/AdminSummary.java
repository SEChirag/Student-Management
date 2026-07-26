package com.test.dto;

public class AdminSummary {

    private String username;
    private String department;

    public AdminSummary(String username, String department) {
        this.username = username;
        this.department = department;
    }

    public String getUsername() {
        return username;
    }

    public String getDepartment() {
        return department;
    }
}
