package com.test.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "doubts")
public class Doubt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String studentUsername;

    private String studentName;

    @Column(nullable = false)
    private String adminUsername;

    private String subject;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(length = 2000)
    private String reply;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime answeredAt;
}
