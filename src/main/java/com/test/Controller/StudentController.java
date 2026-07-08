package com.test.Controller;


import com.test.Entity.*;
import com.test.Repository.AdminProfileRepository;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.Service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin("*")
@RestController
@RequestMapping("/API")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class StudentController {
    private final StudentService service;
    private final UseRepository useRepository;
    private final AdminProfileRepository adminProfileRepository;
    @Autowired
    repository Repo;

    public StudentController(StudentService service, UseRepository useRepository, AdminProfileRepository adminProfileRepository) {
        this.service = service;
        this.useRepository = useRepository;
        this.adminProfileRepository = adminProfileRepository;
    }

    @GetMapping("/all")
    public List<Model> getAllStudents() {
        return service.getAllStudents();
    }

    @GetMapping("/name")
    public Model getbyname(@RequestParam String name) {
        return service.getbyname(name);
    }

    @PostMapping("/add")
    public Model addStudent(@RequestBody Model model, Authentication authentication) {

        String username = authentication.getName();
        User user = useRepository.findByUsername(username).orElseThrow();
        model.setUser(user);
        model.setUsername(user.getUsername());


        return service.addStudent(model);
    }

    @PutMapping("/update/{name}")
    public Model updateStudent(@PathVariable String name, @RequestBody Model model) {
        Model existing = service.getbyname(name);
        existing.setName(model.getName());
        existing.setMarks(model.getMarks());
        existing.setSection(model.getSection());
        existing.setResult(model.getResult());
        existing.setStatus(model.getStatus());
        existing.setAssignments(model.getAssignments());
        existing.setUser(model.getUser());
        System.out.println(model.getAssignments());
        if (model.getUsername() != null) existing.setUsername(model.getUsername());
        if (model.getRollNumber() != null) existing.setRollNumber(model.getRollNumber());
        return service.addStudent(existing);
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

    @PostMapping("/Addassignments")
    public AssignmentsList addAssignments(@RequestBody AssignmentsList assignmentsList) {
        return service.addAssignments(assignmentsList);
    }

    @PatchMapping("/updateAssignments/{studentId}")
    public StudentAssignments updateAssignments(@PathVariable long studentId, @RequestParam long assignmentId, @RequestParam String status) {
        return service.updateAssignments(assignmentId, studentId, status);

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
    public void deleteAssignment(@PathVariable Long id) {
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

    @GetMapping("/assignments")
    public List<AssignmentsList> getAllassignments() {
        return service.getAllassignments();
    }

    @GetMapping("/StuentAssignment/all")
    public List<StudentAssignments> getAllStudentAssignments() {
        return service.getAllStudentAssignments();
    }

    @GetMapping("/profile")
    public ResponseEntity<AdminProfile> getProfile(Authentication auth) {
        System.out.println("Logged user = " + auth.getName());

        Optional<AdminProfile> profile = adminProfileRepository.findByUsername(auth.getName());

        System.out.println("Profile found = " + profile.isPresent());
        AdminProfile add = new AdminProfile();
        add.setUsername(add.getUsername());
        add.setDepartment(add.getDepartment());
        add.setRole(add.getRole());
        add.setStatus(add.getStatus());

        return profile
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/assignments/expired")
    public List<AssignmentsList> getExpiredAssignments() {
        return service.getExpiredAssignments();
    }

}


