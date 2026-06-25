package com.test.Controller;

import com.test.Entity.AssignmentsList;
import com.test.Entity.Model;
import com.test.Entity.User;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.Service.StudentService;
import com.test.util.JwtUtil;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;

@CrossOrigin("*")
@RestController
@RequestMapping("/API")
@PreAuthorize("hasRole('ADMIN')")
public class StudentController {
    private final StudentService service;
    private UseRepository useRepository;
    private repository repository;
    private JwtUtil jwtUtil;

    public StudentController(StudentService service, JwtUtil jwtUtil, repository repo, UseRepository useRepository) {
        this.service = service;
        this.jwtUtil = jwtUtil;
        this.repository = repository;
        this.useRepository = useRepository;
    }

    @GetMapping("/all")
    public List<Model> getAllStudents() {
        return service.getAllStudents();
    }

    @GetMapping("/{id}")
    public Model getbyid(@PathVariable Long id) {
        return service.getbyid(id);
    }

    @PostMapping("/add")
    public Model addStudent(@RequestBody Model model, Authentication authentication) {

        String username = authentication.getName();
        User user = useRepository.findByUsername(username).orElseThrow();
        model.setUser(user);

        return service.addStudent(model);
    }

    @PutMapping("/update")
    public List<Model> updateStudent(@RequestBody List<Model> model) {
        return service.updateStudent(model);
    }

    @DeleteMapping("/delete/{id}")
    public void deleteStudent(@PathVariable long id) {
        service.deleteStudent(id);
    }

    @DeleteMapping("/allDelete")
    public void deleteAllStudents() {
        service.deleteAllStudents();
    }

    @GetMapping("/students")
    public Page<Model> getStudents(@RequestParam int page, @RequestParam int size) {
        return service.getStudents(page, size);
    }

    @GetMapping("/assignments")
    public List<AssignmentsList> addAssignments() {
        return service.addAssignments();
    }

    @PatchMapping("/updateAssignments/{studentId}")
    public AssignmentsList updateAssignments(@RequestParam String assignments , @PathVariable long studentId) {
      return service.updateAssignments(assignments , studentId);

    }

    @GetMapping("/assignments/list/{status}")
    public List<AssignmentsList> getAssignments(@PathVariable String status) {
        return service.getAssignments(status);
    }

    @GetMapping("/allStatus/{status}")
    public List<Model> getAllStatus(@PathVariable String status) {
        return service.getAllStatus(status);
    }

    @GetMapping("/sameName")
    public List<Model> getSameName() {
        return service.getSameName();
    }

    @DeleteMapping("/deletByName")
    public void deleteBySameName() {
        service.deleteBySameName();
    }

    @DeleteMapping("DeleteAssignment/{id}")
    public  void deleteAssignment(@PathVariable Long id) {
        service.deleteAssignment(id);
    }
    @GetMapping("/assignments/summary/{studentId}")
    public Map<String, Object> getSummary(@PathVariable Long studentId) {
        return service.getStudentAssignmentSummary(studentId);
    }
    @GetMapping("/assignments/report")
    public List<Map<String, Object>> getStudentAssignmentReport() {
        return service.getStudentAssignmentReport();
    }


}
