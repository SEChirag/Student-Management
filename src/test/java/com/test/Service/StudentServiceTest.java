package com.test.Service;

import com.test.Entity.Model;
import com.test.Exceptions.StudentNotFoundException;
import com.test.Repository.AssignmentRepo;
import com.test.Repository.StudentAssignmentRepo;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.util.CredentialGenerator;
import com.test.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @Mock
    private repository repo;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private AssignmentRepo assignmentRepo;
    @Mock
    private StudentAssignmentRepo studentAssignmentRepo;
    @Mock
    private UseRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private CredentialGenerator credentialGenerator;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private StudentService studentService;

    private Model student1;
    private Model student2;

    @BeforeEach
    void setUp() {
        student1 = new Model();
        student1.setId(1L);
        student1.setName("Alice");
        student1.setMarks(80);
        student1.setStatus("ACTIVE");
        student1.setSection("A");

        student2 = new Model();
        student2.setId(2L);
        student2.setName("Bob");
        student2.setMarks(25);
        student2.setStatus("INACTIVE");
        student2.setSection("B");
    }

    @Test
    void testGetAllStudents() {
        when(repo.findAll()).thenReturn(Arrays.asList(student1, student2));

        List<Model> result = studentService.getAllStudents();

        assertEquals(2, result.size());
        verify(repo, times(1)).findAll();
    }

    @Test
    void testGetById_Success() {
        when(repo.findById(1L)).thenReturn(Optional.of(student1));

        Model result = studentService.getbyid(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Alice", result.getName());
    }

    @Test
    void testGetById_NotFound() {
        when(repo.findById(10L)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> studentService.getbyid(10L));
    }

    @Test
    void testGetByName() {
        when(repo.findByName("Alice")).thenReturn(student1);

        Model result = studentService.getbyname("Alice");

        assertNotNull(result);
        assertEquals("Alice", result.getName());
    }

    @Test
    void testUpdateExistingStudent() {
        when(repo.save(student1)).thenReturn(student1);

        Model result = studentService.updateExistingStudent(student1);

        assertNotNull(result);
        verify(repo).save(student1);
    }

    @Test
    void testDeleteStudent_Success() {
        when(repo.findById(1L)).thenReturn(Optional.of(student1));

        studentService.deleteStudent(1L);

        verify(repo).delete(student1);
    }

    @Test
    void testDeleteStudent_NotFound() {
        when(repo.findById(100L)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class, () -> studentService.deleteStudent(100L));
    }

    @Test
    void testFailedStudents() {
        when(repo.findAll()).thenReturn(Arrays.asList(student1, student2));

        List<Model> failed = studentService.failedStudents();

        assertEquals(1, failed.size());
        assertEquals("Bob", failed.get(0).getName());
    }

    @Test
    void testPassStudents() {
        when(repo.findAll()).thenReturn(Arrays.asList(student1, student2));

        List<Model> passed = studentService.passStudents();

        assertEquals(1, passed.size());
        assertEquals("Alice", passed.get(0).getName());
    }
}
