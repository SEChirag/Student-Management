package com.test.Repository;

import com.test.Entity.AssignmentsList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssignmentRepo extends JpaRepository<AssignmentsList, Long> {

    List<AssignmentsList> findByStatus(String status);
    List<AssignmentsList> findByStudentId(Long studentId);
    List<AssignmentsList> findByStudentIdAndStatus(Long studentId, String status);
    List<AssignmentsList> findBySectionIn(List<String> section);
    List<AssignmentsList> findByDueDateAfter(LocalDateTime dateTime);
    List<AssignmentsList> findByDueDateBefore(LocalDateTime dateTime);
}
