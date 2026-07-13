package com.test.Repository;

import com.test.Entity.StudentAssignments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentAssignmentRepo extends JpaRepository<StudentAssignments, Long> {
    Optional<StudentAssignments> findByStudentIdAndAssignmentId(Long studentId, Long assignmentId);
    List<StudentAssignments> findByStudentId(Long studentId);
}
