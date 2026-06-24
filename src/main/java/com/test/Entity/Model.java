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
    @Getter
    @Setter
    private String assignments;
    private String status;

    @ManyToOne
    @Getter
    @Setter
    private  User user;
}
