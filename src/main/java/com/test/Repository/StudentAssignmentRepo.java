package com.test.Repository;

import com.test.Entity.StudentAssignments;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentAssignmentRepo extends JpaRepository<StudentAssignments, Long> {
    Optional<StudentAssignments> findByStudentIdAndAssignmentId(Long studentId, Long assignmentId);
    List<StudentAssignments> findByStudentId(Long studentId);
}
