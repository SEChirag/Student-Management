package main.java.com.test.Controller;

import main.java.com.test.Entity.Model;
import main.java.com.test.Service.StudentService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/API")
public class StudentController {
    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
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
    public Model addStudent(@RequestBody Model model) {
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

    @PostMapping("/assignments")
    public Model addAssignments(@RequestBody Model assignments) {
        return service.addAssignments(assignments);
    }

    @GetMapping("/assignments/{status}")
    public List<Model> GetallAssignment(@PathVariable String status) {
        return service.GetallAssignment(status);
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
}
