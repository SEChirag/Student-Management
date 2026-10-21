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

import java.util.HashMap;
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
    public Model addStudent(@RequestBody Model model) {
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
        if (model.getUsername() != null) existing.setUsername(model.getUsername());
        if (model.getRollNumber() != null) existing.setRollNumber(model.getRollNumber());
        return service.updateExistingStudent(existing);
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

    @PatchMapping("/updateAssignments/{id}")
    public Object updateAssignments(
            @PathVariable long id,
            @RequestParam(required = false) Long assignmentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignments) {
        String finalStatus = (status != null) ? status : assignments;
        if (assignmentId != null) {
            return service.updateAssignments(assignmentId, id, finalStatus);
        } else {
            return service.updateAssignmentStatus(id, finalStatus);
        }
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

    @GetMapping({"/StuentAssignment/all", "/StudentAssignment/all"})
    public List<StudentAssignments> getAllStudentAssignments() {
        return service.getAllStudentAssignments();
    }

    @GetMapping("/profile")
    public ResponseEntity<AdminProfile> getProfile(Authentication auth) {
        Optional<AdminProfile> profile = adminProfileRepository.findByUsername(auth.getName());
        return profile
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/assignments/expired")
    public List<AssignmentsList> getExpiredAssignments() {
        return service.getExpiredAssignments();
    }
    @DeleteMapping({"/Delete/expired/Assignments/{id}", "/delete/expired/assignments/{id}"})
    public void deleteExpiredAssignments(@PathVariable Long id) {
        service.deleteExpiredAssignments(id);
    }



    @GetMapping("/failed")
    public List<Model> failedStudents(){
        return service.failedStudents();
    }
    @GetMapping("/pass")
    public List<Model> passStudents(){
        return service.passStudents();
    }
    @GetMapping("/Active")
    public List<Model> ActiveStudents(){
        return service.ActiveStudents();
    }
    @GetMapping("/Inactive")
    public List<Model> InactiveStudents(){
        return service.InactiveStudents();
    }
    @PutMapping({"/Upadate/expired/assignments/{id}", "/update/expired/assignments/{id}"})
    public ResponseEntity<AssignmentsList> updateExpiredAssignments(@PathVariable Long id ,@RequestBody AssignmentsList assignmentsList) {
        AssignmentsList saved = service.updateExpiredAssignments(id , assignmentsList);
        return ResponseEntity.ok(saved);
    }


}


