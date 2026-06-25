package com.test.Repository;

import com.test.Entity.StudentAssignments;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentAssignmentRepo extends JpaRepository<StudentAssignments, Long> {
    Optional<StudentAssignments> findByStudentId(Long studentId);
    Optional<StudentAssignments> findByStudentIdAndAssignmentId(Long studentId, Long assignmentId);
}
