package com.test.Controller;

import com.test.Entity.Doubt;
import com.test.Entity.StudentProfile;
import com.test.Repository.StudentProfileRepository;
import com.test.Service.DoubtService;
import com.test.dto.AdminSummary;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin("*")
@RestController
public class DoubtController {

    private final DoubtService doubtService;
    private final StudentProfileRepository profileRepo;

    public DoubtController(DoubtService doubtService, StudentProfileRepository profileRepo) {
        this.doubtService = doubtService;
        this.profileRepo = profileRepo;
    }

    // ── Student side (Role_USER) ──

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/student/admins")
    public ResponseEntity<List<AdminSummary>> listAdmins() {
        return ResponseEntity.ok(doubtService.listAdmins());
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PostMapping("/student/doubts")
    public ResponseEntity<Doubt> askDoubt(@RequestBody Map<String, String> body, Authentication auth) {
        String username = auth.getName();
        String studentName = profileRepo.findByUsername(username)
                .map(StudentProfile::getFullName)
                .orElse(username);

        Doubt doubt = doubtService.askDoubt(
                username,
                studentName,
                body.get("adminUsername"),
                body.get("subject"),
                body.get("question"));

        return ResponseEntity.ok(doubt);
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @GetMapping("/student/doubts")
    public ResponseEntity<List<Doubt>> myDoubts(Authentication auth) {
        return ResponseEntity.ok(doubtService.getDoubtsForStudent(auth.getName()));
    }

    // ── Admin side ──

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @GetMapping("/API/doubts")
    public ResponseEntity<List<Doubt>> doubtsForAdmin(Authentication auth) {
        return ResponseEntity.ok(doubtService.getDoubtsForAdmin(auth.getName()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @PatchMapping("/API/doubts/{id}/reply")
    public ResponseEntity<Doubt> replyToDoubt(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(doubtService.replyToDoubt(id, auth.getName(), body.get("reply")));
    }
}
