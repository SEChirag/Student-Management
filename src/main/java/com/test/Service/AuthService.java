package com.test.Service;

import com.test.Entity.*;
import com.test.Repository.AdminProfileRepository;
import com.test.Repository.StudentProfileRepository;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final JwtUtil jwtUtil;
    private final UseRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final repository studentRepo;
    private final StudentProfileRepository profileRepo;
    private final AdminProfileRepository adminProfileRepo;

    public AuthService(JwtUtil jwtUtil,
                       UseRepository repo,
                       PasswordEncoder passwordEncoder,
                       repository studentRepo,
                       StudentProfileRepository profileRepo,
                       AdminProfileRepository adminProfileRepo) {

        this.jwtUtil = jwtUtil;
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
        this.studentRepo = studentRepo;
        this.profileRepo = profileRepo;
        this.adminProfileRepo = adminProfileRepo;
    }

    public String register(User user) {
        if (repo.findByUsername(user.getUsername()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is already in use");
        }

        String role = user.getRole();
        role = (role == null) ? null : role.replace("ROLE_", "").toUpperCase();

        if (!"ADMIN".equals(role) && !"USER".equals(role)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role must be ADMIN or USER");
        }

        user.setRole(role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus("PENDING");
        repo.save(user);

        return "Registration submitted - awaiting Super Admin Approval";
    }

    public String login(LoginRequest request) {
        User user = repo.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if ("PENDING".equals(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account pending Super Admin Approval");
        }
        if ("REJECTED".equals(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account rejected by Super Admin");
        }

        boolean passwordMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());
        if (!passwordMatch) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return jwtUtil.generateToken(user.getUsername(), user.getRole());
    }

    public List<User> getPendingUsers() {
        return repo.findByStatus("PENDING");
    }

    public List<User> getAllUsersExcludingSuperAdmin() {
        return repo.findAll().stream()
                .filter(user -> !"SUPER_ADMIN".equalsIgnoreCase(user.getRole()))
                .toList();
    }

    public String approveUser(long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

        if ("SUPER_ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SuperAdmin account can't be approved");
        }

        user.setStatus("APPROVED");
        repo.save(user);
        return user.getUsername() + " Approved successfully";
    }

    public String rejectUser(long id) {
        User user = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "User not found"));

        if ("SUPER_ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SuperAdmin account can't be rejected");
        }

        user.setStatus("REJECTED");
        repo.save(user);
        return user.getUsername() + " Rejected";
    }

    public Object saveProfile(StudentProfile profile) {
        User user = repo.findByUsername(profile.getUsername()).orElse(null);
        String role = (user != null) ? user.getRole() : "USER";

        if ("ADMIN".equalsIgnoreCase(role)) {
            return saveAdminProfile(profile);
        }
        return saveStudentProfile(profile);
    }

    private AdminProfile saveAdminProfile(StudentProfile profile) {
        AdminProfile adminToSave = adminProfileRepo.findByUsername(profile.getUsername())
                .map(existing -> {
                    existing.setDepartment(profile.getSection());
                    if (existing.getStatus() == null) existing.setStatus("APPROVED");
                    if (existing.getRole() == null) existing.setRole("ADMIN");
                    return existing;
                })
                .orElseGet(() -> {
                    AdminProfile a = new AdminProfile();
                    a.setUsername(profile.getUsername());
                    a.setDepartment(profile.getSection());
                    a.setRole("ADMIN");
                    a.setStatus("APPROVED");
                    return a;
                });
        return adminProfileRepo.save(adminToSave);
    }

    private StudentProfile saveStudentProfile(StudentProfile profile) {
        StudentProfile toSave = profileRepo.findByUsername(profile.getUsername())
                .map(existing -> {
                    existing.setFullName(profile.getFullName());
                    existing.setRollNumber(profile.getRollNumber());
                    existing.setSection(profile.getSection());
                    return existing;
                })
                .orElse(profile);

        StudentProfile saved = profileRepo.save(toSave);

        syncStudentRecord(profile);

        return saved;
    }

    private void syncStudentRecord(StudentProfile profile) {
        studentRepo.findByRollNumber(profile.getRollNumber()).ifPresent(student -> {
            student.setUsername(profile.getUsername());
            student.setRollNumber(profile.getRollNumber());
            studentRepo.save(student);
        });

        studentRepo.findByUsername(profile.getUsername()).ifPresent(student -> {
            if (student.getRollNumber() == null || student.getRollNumber().isEmpty()) {
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
            student.setMarks(0);
            student.setResult("pending");
            student.setStatus("Active");
            studentRepo.save(student);
        }
    }

    public Optional<StudentProfile> getProfile(String username) {
        return profileRepo.findByUsername(username);
    }

    public Map<String, String> getMe(String authHeader) {
        String token = authHeader.replace("Bearer ", "");

        if (!jwtUtil.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
        }

        String username = jwtUtil.extractUsername(token);
        String role = jwtUtil.extractRole(token);

        User user = repo.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));

        Map<String, String> info = new HashMap<>();
        info.put("username", username);
        info.put("role", role);
        info.put("status", user.getStatus());
        return info;
    }

    public Map<String, String> oauthToken(String username, String password) {
        User user = repo.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String jwt = jwtUtil.generateToken(username, user.getRole());

        Map<String, String> response = new HashMap<>();
        response.put("access_token", jwt);
        response.put("token_type", "bearer");
        return response;
    }

    public List<User> getRejectedUsers() {
       return repo.findByStatus("REJECTED");
    }

    public List<User> getApprovedUsers() {
        return repo.findByStatus("APPROVED");
    }

    public void deleteUser(long id) {
        repo.deleteById(id);
    }

    public User getUser(String username) {
        return repo.findByUsernameIgnoreCase(username).filter(u->u.getUsername().equalsIgnoreCase(username)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
    }
}