package main.java.com.test.Entity;

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
    private String name;
    private long marks;
    private String section;
    private  String result;
    private String assignments;
    private String status;
//    @Getter @Setter
//    private long Even;


//    public Model(long id, String name , long marks ,String section , String result, String assignments) {
//        this.id = id;
//        this.name = name;
//        this.marks = marks;
//        this.section=section;
//        this.result = result;
//        this.assignments = assignments;
//
//
//    }

}
