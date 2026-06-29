package com.test.Repository;

import com.test.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UseRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
    List<User> findByStatus(String status);
}
