package com.test.Repository;



import com.test.Entity.Model;
import com.test.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface repository extends JpaRepository<Model, Long> {
    List<Model> findByStatus(String status);
    Optional<Model> findByUsername(String username);


}
