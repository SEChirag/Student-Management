package com.test.Controller;

import com.test.Entity.AssignmentsList;
import com.test.Entity.Model;
import com.test.Entity.StudentAssignments;
import com.test.Entity.StudentProfile;
import com.test.Repository.AssignmentRepo;
import com.test.Repository.StudentAssignmentRepo;
import com.test.Repository.StudentProfileRepository;
import com.test.Repository.repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin("*")
@RestController
@RequestMapping("/student")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class UserStudentController {

    @Autowired
    private AssignmentRepo assignmentRepo;
    @Autowired
    private StudentAssignmentRepo studentAssignmentRepo;
    @Autowired
    private repository studentRepo;
    @Autowired
    private StudentProfileRepository profileRepo;

    private StudentProfile getProfile(String username) {
        return profileRepo.findByUsername(username).orElse(null);
    }

    @GetMapping("/my-assignments")
    public ResponseEntity<?> myAssignments(Authentication auth) {
        StudentProfile profile = getProfile(auth.getName());
        if (profile == null) return ResponseEntity.status(404).body("Profile not set up");

        List<AssignmentsList> mine = assignmentRepo.findAll().stream()
                .filter(a -> "ALL".equalsIgnoreCase(a.getSection())
                        || a.getSection().equalsIgnoreCase(profile.getSection()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(mine);
    }

    @GetMapping("/my-completion")
    public ResponseEntity<?> myCompletion(Authentication auth) {
        StudentProfile profile = getProfile(auth.getName());
        if (profile == null) return ResponseEntity.status(404).body("Profile not set up");

        return ResponseEntity.ok(
                studentRepo.findByUsername(auth.getName())
                        .map(student -> studentAssignmentRepo.findByStudentId(student.getId()))
                        .orElse(List.of())
        );
    }

//    @PatchMapping("/toggle/{assignmentId}")
//    public ResponseEntity<?> toggle(@PathVariable Long assignmentId,
//                                    @RequestParam String status,
//                                    Authentication auth) {
//        StudentProfile profile = getProfile(auth.getName());
//        if (profile == null) return ResponseEntity.status(404).body("Profile not set up");
//
//        return studentRepo.findByUsername(auth.getName())
//                .map(student -> {
//                    StudentAssignments sa = studentAssignmentRepo
//                            .findByStudentIdAndAssignmentId(student.getId(), assignmentId)
//                            .orElse(new StudentAssignments());
//                    sa.setStudentId(student.getId());
//                    sa.setAssignmentId(assignmentId);
//                    sa.setStatus(status);
//                    return ResponseEntity.ok(studentAssignmentRepo.save(sa));
//                })
//                .orElse(ResponseEntity.status(404).build());
//    }

    @GetMapping("/my-marks")
    public ResponseEntity<?> myMarks(Authentication auth) {
        String username = auth.getName();
      //  System.out.println("DEBUG my-marks called with username: '" + username + "'");

        StudentProfile profile = getProfile(username);
      //  System.out.println("DEBUG profile found: " + (profile != null));

        if (profile == null) return ResponseEntity.status(404).body("Profile not set up");

        Optional<Model> student = studentRepo.findByRollNumber(profile.getRollNumber());
       // System.out.println("DEBUG student found: " + student.isPresent());
        if (student.isPresent()) {
       //     System.out.println("DEBUG student marks: " + student.get().getMarks());
        }

        if (student.isEmpty()) return ResponseEntity.status(404).body("Marks not assigned yet");
        return ResponseEntity.ok(student.get());
    }

    @GetMapping("/my-profile")
    public ResponseEntity<?> myProfile(Authentication auth) {

       // System.out.println("Logged user = " + auth.getName());

        Optional<StudentProfile> profile =
                profileRepo.findByUsername(auth.getName());

    //    System.out.println("Profile found = " + profile.isPresent());

        return profile
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}