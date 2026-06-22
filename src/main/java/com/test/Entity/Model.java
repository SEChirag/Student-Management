package com.test.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@Entity
@Table(name = "student")
@NoArgsConstructor
public class Model {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String username;
    private String name;
    private long marks;
    private String section;
    private String result;
    private String assignments;
    private String status;

    @ManyToOne
    @JoinColumn(name ="user_id")
    private  User user;
}
