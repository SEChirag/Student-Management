package com.test.Service;


import com.test.Entity.Model;
import com.test.Exceptions.StudentNotFoundException;
import com.test.Repository.repository;





import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StudentService {
    private final repository Repo;

    public StudentService(repository Repo) {
        this.Repo = Repo;
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

    public Model addAssignments(Model assignments) {
        return Repo.save(assignments);
    }

    public List<Model> GetallAssignment(String status) {

        return Repo.findAll().stream()
                .filter(s -> s.getAssignments() != null &&
                        s.getAssignments().equalsIgnoreCase(status))
                .toList();
    }

    public List<Model> getAllStatus(String status) {
        return Repo.findByStatus(status);
    }

    public void deleteBySameName() {

        List<Model> duplicateName = getSameName().stream().filter(student -> student.getMarks() < 30).collect(Collectors.toList());

        Repo.deleteAll(duplicateName);
    }

    public List<Model> getSameName() {
        List<Model> students = Repo.findAll();

        Map<String, Long> nameCount = students.stream().collect(Collectors.groupingBy(s -> s.getName().toLowerCase(), Collectors.counting()));

        return students.stream().filter(s -> nameCount.get(s.getName().toLowerCase()) > 1).sorted(Comparator.comparing(Model -> Model.getName())).collect(Collectors.toList());
    }
}
