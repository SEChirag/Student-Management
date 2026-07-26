package com.test.Repository;

import com.test.Entity.Doubt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoubtRepository extends JpaRepository<Doubt, Long> {

    List<Doubt> findByStudentUsernameOrderByCreatedAtDesc(String studentUsername);
    List<Doubt> findByAdminUsernameOrderByCreatedAtDesc(String adminUsername);
}
