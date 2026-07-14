package com.test.Service;



import com.test.Entity.AssignmentsList;
import com.test.Entity.Model;
import com.test.Entity.StudentAssignments;
import com.test.Entity.User;
import com.test.Event.StudentAccountCreateEvent;
import com.test.Exceptions.StudentNotFoundException;
import com.test.Repository.AssignmentRepo;
import com.test.Repository.StudentAssignmentRepo;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;


import com.test.util.CredentialGenerator;
import com.test.util.JwtUtil;
import jakarta.transaction.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;
@Service
public class StudentService {
    private final repository Repo;
    private final JwtUtil jwtUtil;
    private final AssignmentRepo AssignmentRepo;
    private final StudentAssignmentRepo StudentAssignmentRepo;

    private final UseRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CredentialGenerator credentialGenerator;
    private final ApplicationEventPublisher eventPublisher;

    public StudentService(repository Repo, JwtUtil jwtUtil, AssignmentRepo AssignmentRepo, StudentAssignmentRepo StudentAssignmentRepo , UseRepository userRepository,
                          CredentialGenerator credentialGenerator,ApplicationEventPublisher eventPublisher,PasswordEncoder passwordEncoder) {
        this.Repo = Repo;
        this.jwtUtil = jwtUtil;
        this.AssignmentRepo = AssignmentRepo;
        this.StudentAssignmentRepo = StudentAssignmentRepo;
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
        this.credentialGenerator=credentialGenerator;
        this.eventPublisher=eventPublisher;
    }

    public List<Model> getAllStudents() {
        List<Model> students = Repo.findAll();
        List<Model> sorted = students.stream()
                .sorted(Comparator.comparing(Model::getName,String.CASE_INSENSITIVE_ORDER).thenComparing(Model::getName))
                .toList();
        return sorted;
    }

    public Model getbyname(String name) {
        return Repo.findByName(name);
    }

//    public Model addStudent(Model model) {
//        return Repo.save(model);
//
//    }

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
        if ("ALL".equalsIgnoreCase(saved.getSection())) {
            students = Repo.findAll();
        } else {
            students = Repo.findBySection(saved.getSection());
        }
        List<StudentAssignments> records = students.stream().map(student -> {
            StudentAssignments sa = new StudentAssignments();
            sa.setStudentId(saved.getStudentId());
            sa.setAssignmentId(saved.getId());
            sa.setStatus(saved.getStatus());



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


    public StudentAssignments updateAssignments(Long assignmentId, Long studentId, String status) {

        StudentAssignments record = StudentAssignmentRepo.findByStudentIdAndAssignmentId(studentId, assignmentId).orElse(new StudentAssignments());
        record.setStudentId(studentId);
        record.setAssignmentId(assignmentId);
        record.setStatus(status);


        return StudentAssignmentRepo.save(record);
    }

    public void deleteAssignment(Long id) {
        AssignmentRepo.deleteById(id);
    }

    public List<AssignmentsList> getAssignments(String status) {
        if (status.equals("all"))
            return AssignmentRepo.findAll();

        return AssignmentRepo.findByStatus(status);

    }

    public Map<String, Object> getStudentAssignmentSummary(Long studentId) {
        List<AssignmentsList> all = AssignmentRepo.findByStudentId(studentId);
        List<StudentAssignments> allAssignments = StudentAssignmentRepo.findAll();

        long completed = all.stream().filter(a -> "completed".equalsIgnoreCase(a.getStatus())).count();
        long incompleted = all.stream().filter(a -> "incompleted".equalsIgnoreCase(a.getStatus())).count();
        long pending = all.stream().filter(a -> "pending".equalsIgnoreCase(a.getStatus())).count();
        Map<String, Object> map = new HashMap<>();
        map.put("studentId", studentId);
        map.put("total", all.size());
        map.put("completed", completed);
        map.put("incompleted", incompleted);
        map.put("pending", pending);
        for(Map.Entry<String , Object> entry : map.entrySet()) {
            System.out.println(map.values());
        }
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

            long completed = studentAssignments.stream().filter(a -> "completed".equals(a.getStatus())).count();
            long incompleted = studentAssignments.stream().filter(a -> "incompleted".equals(a.getStatus())).count();
            long pending = totalStudent - completed - incompleted;

            Map<String, Object> map = new HashMap<>();
            map.put("studentId", s.getId());
            map.put("studentName", s.getName());
            map.put("section", s.getSection());
            map.put("total", studentAssignments.size());
            map.put("completed", completed);
            map.put("incompleted", incompleted);
            map.put("pending", pending);
            return map;
        }).collect(Collectors.toList());
    }

    public List<AssignmentsList> getAllassignments() {

        return AssignmentRepo.findByDueDateAfter(LocalDateTime.now());
    }
    public List<AssignmentsList> getExpiredAssignments() {
        return AssignmentRepo.findByDueDateBefore(LocalDateTime.now());
    }

    public List<StudentAssignments> getAllStudentAssignments() {
        return StudentAssignmentRepo.findAll();
    }
    @Transactional
    public Model addStudent(Model model) {

        if(Repo.existsByEmail(model.getEmail())){
            throw new ResponseStatusException(HttpStatusCode.valueOf(409) ,"Email already Exist");
        }
        String username = credentialGenerator.generateUsername(model.getName(), model.getRollNumber());
        String tempPassword = credentialGenerator.generateTempPassword();

        User studentUser = new User();
        studentUser.setUsername(username);
        studentUser.setPassword(passwordEncoder.encode(tempPassword));
        studentUser.setRole("STUDENT");
        studentUser.setStatus("APPROVED");
        userRepository.save(studentUser);

        model.setUser(studentUser);
        model.setUsername(username);
        Model saved = Repo.save(model);

        eventPublisher.publishEvent(new StudentAccountCreateEvent(saved, tempPassword));

        return saved;
    }

    public List<Model> failedStudents() {
        return Repo.findAll().stream().filter(student -> student.getMarks() <35).toList();

    }

    public List<Model> passStudents() {
        return Repo.findAll().stream().filter(student -> student.getMarks()>32).sorted(Comparator.comparing(Model::getMarks).reversed()).toList();
    }

    public List<Model> ActiveStudents() {
        return Repo.findAll().stream().filter(student -> student.getStatus().equalsIgnoreCase("ACTIVE")).sorted(Comparator.comparing(Model ::getName, String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public List<Model> InactiveStudents() {
        return Repo.findAll().stream().filter(student -> student.getStatus().equalsIgnoreCase("INACTIVE")).sorted(Comparator.comparing(Model::getName,String.CASE_INSENSITIVE_ORDER)).toList();
    }

    public void deleteExpiredAssignments(Long id) {
        Optional<AssignmentsList> optionalAssignment = AssignmentRepo.findById(id);

        if (optionalAssignment.isEmpty()) {
            throw new RuntimeException("Assignment not found with id: " + id);
        }

        AssignmentsList assignment = optionalAssignment.get();

        boolean isExpired = assignment.getDueDate() != null
                && assignment.getDueDate().isBefore(LocalDateTime.now());

        if (isExpired) {
            AssignmentRepo.deleteById(id);
        } else {
            throw new RuntimeException("Assignment is not expired, cannot delete: " + id);
        }
    }
    public AssignmentsList updateExpiredAssignments(Long id, AssignmentsList assignmentsList) {
        AssignmentsList existing = AssignmentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Assignment not found with id: " + id));

        if (assignmentsList.getAssignments() != null) {
            existing.setAssignments(assignmentsList.getAssignments());
        }

        if (assignmentsList.getDescription() != null) {
            existing.setDescription(assignmentsList.getDescription());
        }

        if (assignmentsList.getSubjects() != null) {
            existing.setSubjects(assignmentsList.getSubjects());
        }

        if (assignmentsList.getDueDate() != null) {
            existing.setDueDate(assignmentsList.getDueDate());
        }

        if (assignmentsList.getSection() != null) {
            existing.setSection(assignmentsList.getSection());
        }

        return AssignmentRepo.save(existing);
    }

}



