package com.test.Event;

import com.test.Entity.Model;

public class StudentAccountCreateEvent {
    private final Model student;
    private String tempPassword;

    public  StudentAccountCreateEvent(Model student, String tempPassword) {
        this.student = student;
        this.tempPassword = tempPassword;
    }

    public Model getStudent() { return student; }
    public String getTempPassword() { return tempPassword; }
}

