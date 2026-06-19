package main.java.com.test.Repository;


import main.java.com.test.Entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface repository extends JpaRepository<Model, Long> {
    List<Model> findByStatus(String status);
}
