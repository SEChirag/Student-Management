package com.test.Repository;

import com.test.Entity.Model;
import com.test.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UseRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);
}
