package com.test.Repository;



import com.test.Entity.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.List;
import java.util.Optional;

@Repository
public interface repository extends JpaRepository<Model, Long> {
    List<Model> findByStatus(String status);
    Optional<Model> findByRollNumber(String rollNumber);
    List<Model> findBySection(String section);
    @Query("SELECT m FROM Model m WHERE LOWER(TRIM(m.username)) = LOWER(TRIM(:username))")
    Optional<Model> findByUsername(@Param("username") String username);

   Model findByName(String name);
}
