package com.test.Entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;


@Getter
@Setter
@Entity
@Table(name = "Assignments")
public class AssignmentsList {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  long id;
    private  String assignments;
    private String subjects;
    private String Description;
    private LocalDateTime dueDate;
    private String status;
    private String section;
private Long studentId;


}
