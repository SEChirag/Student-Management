package com.test.Repository;



import com.test.Entity.Model;
import com.test.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface repository extends JpaRepository<Model, Long> {
    List<Model> findByStatus(String status);
    Optional<Model> findByUsername(String username);


}
