package com.test.AuthController;

import com.test.Entity.LoginRequest;
import com.test.Entity.Model;
import com.test.Entity.StudentProfile;
import com.test.Entity.User;
import com.test.Repository.StudentProfileRepository;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthControl {

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UseRepository repo;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private repository studentRepo;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username is already in use");
        }
        String role = user.getRole();
        if (role != null)
            role = role.replace("ROLE_", "").toUpperCase();

        if (!"ADMIN".equals(role) && !"USER".equals(role)) {
            return ResponseEntity.badRequest().body("Role must be ADMIN or USER");
        }
        if (user.getRole() == null || !user.getRole().equals("ADMIN") && !user.getRole().equals("USER")) {
            return ResponseEntity.badRequest().body("Role must be ADMIN or USER");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus("PENDING");
        repo.save(user);
        return ResponseEntity.ok("Registration submitted - awaiting Super Admin Approval");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        User user = repo.findByUsername(request.getUsername()).orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body("User not found");
        }
        if ("PENDING".equals(user.getStatus())) {
            return ResponseEntity.status(403).body("Account pending Super Admin Approval");
        }
        if ("REJECTED".equals(user.getStatus())) {
            return ResponseEntity.status(403).body("Account rejected Super Admin Approval");
        }
        boolean passWordMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!passWordMatch) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        return ResponseEntity.ok(jwtUtil.generateToken(user.getUsername(), user.getRole()));

    }
    @GetMapping("/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        return ResponseEntity.ok(repo.findByStatus("PENDING"));
    }
    @GetMapping("/users")
    public  ResponseEntity<List<User>> getUsers() {
        List<User> users =repo.findAll().stream().filter(user -> !"SUPER_ADMIN".equalsIgnoreCase(user.getRole())).toList();
        return ResponseEntity.ok(users);
    }
    @PatchMapping("/approve/{id}")
    public ResponseEntity<String> approveUser(@PathVariable long id) {
        User user = repo.findById(id).orElse(null);
        if (user == null){
            return ResponseEntity.badRequest().body("User not found");
    }
        if("SUPER_ADMIN".equalsIgnoreCase(user.getRole())){
            return ResponseEntity.badRequest().body("SuperAdmin account cant be Approved");
        }
        user.setStatus("APPROVED");
        repo.save(user);
        return ResponseEntity.ok(user.getUsername() + " Approved successfully");
    }
    @PatchMapping("/reject/{id}")
    public ResponseEntity<String> rejectUser(@PathVariable long id) {
        User user = repo.findById(id).orElse(null);
        if(user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        if("SUPER_ADMIN".equalsIgnoreCase(user.getRole())){
            return ResponseEntity.badRequest().body("SuperAdmin account cant be rejected");
        }
        user.setStatus("REJECTED");
        repo.save(user);
        return ResponseEntity.ok(user.getUsername() +"Rejected");
    }
    @Autowired
    private StudentProfileRepository profileRepo;

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody StudentProfile profile) {
        StudentProfile toSave = profileRepo.findByUsername(profile.getUsername())
                .map(existing -> {
                    existing.setFullName(profile.getFullName());
                    existing.setRollNumber(profile.getRollNumber());
                    existing.setSection(profile.getSection());

                    return existing;
                })
                .orElse(profile);

        StudentProfile saved = profileRepo.save(toSave);

        studentRepo.findByRollNumber(profile.getRollNumber()).ifPresent(student -> {
            student.setUsername(profile.getUsername());
            student.setRollNumber(profile.getRollNumber());
            studentRepo.save(student);
        });
        studentRepo.findByUsername(profile.getUsername()).ifPresent(student -> {
            if(student.getRollNumber() == null || student.getRollNumber().isEmpty()) {
                student.setRollNumber(profile.getRollNumber());
                studentRepo.save(student);
            }
        });

        if (studentRepo.findByUsername(profile.getUsername()).isEmpty()) {
            Model student = new Model();
            student.setName(profile.getFullName());
            student.setUsername(profile.getUsername());
            student.setSection(profile.getSection());
            student.setRollNumber(profile.getRollNumber());
            student.setRollNumber(profile.getRollNumber());
            student.setMarks(0);
            student.setResult("pending");
            student.setStatus("Active");
            studentRepo.save(student);
        }

        return ResponseEntity.ok(saved);
    }
    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        return profileRepo.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        if (!jwtUtil.validateToken(token))
            return ResponseEntity.status(401).body("Invalid token");

        String username = jwtUtil.extractUsername(token);
        String role     = jwtUtil.extractRole(token);

        User user = repo.findByUsername(username).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("Not found");

        Map<String, String> info = new HashMap<>();

        info.put("username", username);
        info.put("role", role);
        info.put("status", user.getStatus());
        return ResponseEntity.ok(info);
    }

}
