package com.test.Service;


import com.test.Entity.AssignmentsList;
import com.test.Entity.Model;
import com.test.Entity.StudentAssignments;
import com.test.Exceptions.StudentNotFoundException;
import com.test.Repository.AssignmentRepo;
import com.test.Repository.StudentAssignmentRepo;
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
    private final StudentAssignmentRepo StudentAssignmentRepo;


    public StudentService(repository Repo , JwtUtil jwtUtil,AssignmentRepo AssignmentRepo , StudentAssignmentRepo StudentAssignmentRepo) {
        this.Repo = Repo;
        this.jwtUtil=jwtUtil;
        this.AssignmentRepo=AssignmentRepo;
        this.StudentAssignmentRepo=StudentAssignmentRepo;
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

    public AssignmentsList addAssignments(AssignmentsList assignmentsList) {
        AssignmentsList saved = AssignmentRepo.save(assignmentsList);

        List<Model> students;
        if("ALL".equalsIgnoreCase(saved.getSection())){
            students =Repo.findAll();
        }else {
            students = Repo.findBySection(saved.getSection());
        }
        List<StudentAssignments> records = students.stream().map(student -> {
            StudentAssignments sa = new StudentAssignments();
            sa.setStudentId(student.getId());
            sa.setAssignmentId(saved.getId());
            sa.setStatus("pending");
            return sa;
        }).collect(Collectors.toList());

        StudentAssignmentRepo.saveAll(records);

return saved;
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


    public StudentAssignments updateAssignments(Long assignmentId , Long studentId,String status) {

       StudentAssignments record = StudentAssignmentRepo.findByStudentIdAndAssignmentId(studentId ,assignmentId).orElse(new StudentAssignments());
            record.setStudentId(studentId);
            record.setAssignmentId(assignmentId);
            record.setStatus(status);


       return StudentAssignmentRepo.save(record);
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
        long totalStudent = AssignmentRepo.count();
        List<StudentAssignments> allAssignments = StudentAssignmentRepo.findAll();

        return students.stream().map(s -> {
            List<StudentAssignments> studentAssignments = allAssignments.stream()
                    .filter(a -> a.getStudentId() != null && a.getStudentId().equals(s.getId()))
                    .collect(Collectors.toList());

            long completed   = studentAssignments.stream().filter(a -> "completed".equals(a.getStatus())).count();
            long incompleted = studentAssignments.stream().filter(a -> "incompleted".equals(a.getStatus())).count();
            long pending     = totalStudent - completed - incompleted;

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

    public List<AssignmentsList> getAllassignments() {

        return AssignmentRepo.findAll();
    }

    public List<StudentAssignments> getAllStudentAssignments() {
        return StudentAssignmentRepo.findAll();
    }
}
