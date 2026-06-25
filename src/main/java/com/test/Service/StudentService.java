package com.test.Service;


import com.test.Entity.AssignmentsList;
import com.test.Entity.Model;
import com.test.Exceptions.StudentNotFoundException;
import com.test.Repository.AssignmentRepo;
import com.test.Repository.repository;


import com.test.util.JwtUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@Service
public class StudentService {
    private final repository Repo;
    private final JwtUtil jwtUtil;
    private final AssignmentRepo AssignmentRepo;


    public StudentService(repository Repo , JwtUtil jwtUtil,AssignmentRepo AssignmentRepo) {
        this.Repo = Repo;
        this.jwtUtil=jwtUtil;
        this.AssignmentRepo=AssignmentRepo;
    }

    public List<Model> getAllStudents() {
        return Repo.findAll();
    }

    public Model getbyid(Long id) {
        return Repo.findById(id).orElseThrow(() -> new StudentNotFoundException("Id not found->" + id));
    }

    public Model addStudent(Model model) {
        return Repo.save(model);

    }

    public List<Model> updateStudent(List<Model> model) {
        return Repo.saveAll(model);
    }

    public void deleteStudent(long id) {
        Model student = Repo.findById(id).orElseThrow(() -> new StudentNotFoundException("Id not found->" + id + "->you can't delete"));
        Repo.delete(student);
    }

    public void deleteAllStudents() {
        Repo.deleteAll();
    }


    public Page<Model> getStudents(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return Repo.findAll(pageable);
    }

    public List<AssignmentsList> addAssignments() {
        return AssignmentRepo.findAll();
    }

    public List<AssignmentsList> getallAssignment() {

            return AssignmentRepo.findAll();
    }

    public List<Model> getAllStatus(String status) {
        return Repo.findByStatus(status);
    }

    public void deleteBySameName() {

        List<Model> duplicateName = getSameName().stream().filter(student -> student.getMarks() < 30).collect(toList());

        Repo.deleteAll(duplicateName);
    }

    public List<Model> getSameName() {
        List<Model> students = Repo.findAll();

        Map<String, Long> nameCount = students.stream().collect(Collectors.groupingBy(s -> s.getName().toLowerCase(), Collectors.counting()));

        return students.stream().filter(s -> nameCount.get(s.getName().toLowerCase()) > 1).sorted(Comparator.comparing(Model -> Model.getName())).collect(toList());
    }


    public AssignmentsList updateAssignments(String assignments , long studentId) {

       AssignmentsList student = AssignmentRepo.findById(studentId).orElseThrow();
            student.setAssignments(assignments);

       return AssignmentRepo.save(student);
    }

    public void deleteAssignment(Long id) {
        AssignmentRepo.deleteById(id);
    }

    public List<AssignmentsList> getAssignments(String status) {
       if( status.equals("all"))
           return AssignmentRepo.findAll();

        return AssignmentRepo.findByStatus(status);

    }
    public Map<String, Object> getStudentAssignmentSummary(Long studentId) {
        List<AssignmentsList> all = AssignmentRepo.findByStudentId(studentId);
        long completed   = all.stream().filter(a -> "completed".equals(a.getStatus())).count();
        long incompleted = all.stream().filter(a -> "incompleted".equals(a.getStatus())).count();
        long pending     = all.stream().filter(a -> "pending".equals(a.getStatus())).count();
        Map<String, Object> map = new HashMap<>();
        map.put("studentId", studentId);
        map.put("total", all.size());
        map.put("completed", completed);
        map.put("incompleted", incompleted);
        map.put("pending", pending);
        return map;
    }
    public List<Map<String, Object>> getStudentAssignmentReport() {
        List<Model> students = Repo.findAll();
        List<AssignmentsList> allAssignments = AssignmentRepo.findAll();

        return students.stream().map(s -> {
            List<AssignmentsList> studentAssignments = allAssignments.stream()
                    .filter(a -> a.getStudentId() != null && a.getStudentId().equals(s.getId()))
                    .collect(Collectors.toList());

            long completed   = studentAssignments.stream().filter(a -> "completed".equals(a.getStatus())).count();
            long incompleted = studentAssignments.stream().filter(a -> "incompleted".equals(a.getStatus())).count();
            long pending     = studentAssignments.stream().filter(a -> "pending".equals(a.getStatus())).count();

            Map<String, Object> map = new HashMap<>();
            map.put("studentId",   s.getId());
            map.put("studentName", s.getName());
            map.put("section",     s.getSection());
            map.put("total",       studentAssignments.size());
            map.put("completed",   completed);
            map.put("incompleted", incompleted);
            map.put("pending",     pending);
            return map;
        }).collect(Collectors.toList());
    }
}
