package test.test.testService;


import com.test.Entity.Model;
import com.test.Repository.repository;
import com.test.Service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
public class StudentServiceTest {

    @Mock
    private repository repo;

    @InjectMocks
    private StudentService studentService;

    private Model student1;
    private Model student2;

    @BeforeEach
    void setUp() {

        student1 = new Model();
        student1.setId(1L);
        student1.setAssignments("Completed");

        student2 = new Model();
        student2.setId(2L);
        student2.setAssignments("Pending");
    }

    // ==========================
    // getAllStudents()
    // ==========================

    @Test
    void testGetAllStudents() {

        List<Model> students = Arrays.asList(student1, student2);

        when(repo.findAll()).thenReturn(students);

        List<Model> result = studentService.getAllStudents();

        assertEquals(2, result.size());
        verify(repo, times(1)).findAll();
    }

    // ==========================
    // getbyid()
    // ==========================

    @Test
    void testGetById_Success() {

        when(repo.findById(1L)).thenReturn(Optional.of(student1));

        Model result = studentService.getbyid(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testGetById_NotFound() {

        when(repo.findById(10L)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class,
                () -> studentService.getbyid(10L));
    }

    // ==========================
    // addStudent()
    // ==========================

    @Test
    void testAddStudent() {

        Model students = studentService.addStudent(student1);

        when(repo.save(students)).thenReturn(students);

        List<Model> result = Collections.singletonList(studentService.addStudent(students));

        assertEquals(1, result.size());
        verify(repo).save(students);
    }

    // ==========================
    // updateStudent()
    // ==========================

    @Test
    void testUpdateStudent() {

        List<Model> students = Arrays.asList(student1, student2);

        when(repo.saveAll(students)).thenReturn(students);

        List<Model> result = studentService.updateStudent(students);

        assertEquals(2, result.size());
        verify(repo).saveAll(students);
    }

    // ==========================
    // deleteStudent()
    // ==========================

    @Test
    void testDeleteStudent_Success() {

        when(repo.findById(1L)).thenReturn(Optional.of(student1));

        studentService.deleteStudent(1L);

        verify(repo).delete(student1);
    }

    @Test
    void testDeleteStudent_NotFound() {

        when(repo.findById(100L)).thenReturn(Optional.empty());

        assertThrows(StudentNotFoundException.class,
                () -> studentService.deleteStudent(100L));
    }

    // ==========================
    // deleteAllStudents()
    // ==========================

    @Test
    void testDeleteAllStudents() {

        studentService.deleteAllStudents();

        verify(repo, times(1)).deleteAll();
    }

    // ==========================
    // getEvenId()
    // ==========================

//    @Test
//    void testGetEvenId() {
//
//        List<Model> students = Arrays.asList(student1, student2);
//
//        when(repo.findAll()).thenReturn(students);
//
//        List<Model> result = studentService.getEvenId();
//
//        assertEquals(1, result.size());
//        assertEquals(2, result.get(0).getEven());
//    }

    // ==========================
    // getStudents()
    // ==========================

    @Test
    void testGetStudents() {

        Pageable pageable = PageRequest.of(0, 2);

        Page<Model> page =
                new PageImpl<>(Arrays.asList(student1, student2));

        when(repo.findAll(pageable)).thenReturn(page);

        Page<Model> result = studentService.getStudents(0, 2);

        assertEquals(2, result.getContent().size());
        verify(repo).findAll(pageable);
    }

    // ==========================
    // addAssignments()
    // ==========================

    @Test
    void testAddAssignments() {

        when(repo.save(student1)).thenReturn(student1);

        Model result = studentService.addAssignments(student1);

        assertNotNull(result);
        assertEquals("Completed", result.getAssignments());
    }

    // ==========================
    // GetallAssignment()
    // ==========================

    @org.testng.annotations.Test
    void testGetAllAssignment() {

        List<Model> students = Arrays.asList(student1, student2);

        when(repo.findAll()).thenReturn(students);

        List<Model> result =
                studentService.GetallAssignment("Completed");

        assertEquals(1, result.size());
        assertEquals("Completed",
                result.get(0).getAssignments());
    }
}