package com.test.Service;

import com.test.Entity.AdminProfile;
import com.test.Entity.Doubt;
import com.test.Entity.User;
import com.test.Repository.AdminProfileRepository;
import com.test.Repository.DoubtRepository;
import com.test.Repository.UseRepository;
import com.test.dto.AdminSummary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DoubtService {

    private final DoubtRepository doubtRepository;
    private final UseRepository useRepository;
    private final AdminProfileRepository adminProfileRepository;

    public DoubtService(DoubtRepository doubtRepository,
                         UseRepository useRepository,
                         AdminProfileRepository adminProfileRepository) {
        this.doubtRepository = doubtRepository;
        this.useRepository = useRepository;
        this.adminProfileRepository = adminProfileRepository;
    }

    public List<AdminSummary> listAdmins() {
        return useRepository.findByRoleAndStatus("ADMIN", "APPROVED").stream()
                .map(admin -> new AdminSummary(
                        admin.getUsername(),
                        adminProfileRepository.findByUsername(admin.getUsername())
                                .map(AdminProfile::getDepartment)
                                .orElse(null)))
                .toList();
    }

    public Doubt askDoubt(String studentUsername, String studentName, String adminUsername, String subject, String question) {
        if (question == null || question.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Question cannot be empty");
        }
        if (adminUsername == null || adminUsername.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select an admin");
        }

        User admin = useRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Selected admin not found"));
        if (!"ADMIN".equalsIgnoreCase(admin.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected user is not an admin");
        }

        Doubt doubt = new Doubt();
        doubt.setStudentUsername(studentUsername);
        doubt.setStudentName(studentName);
        doubt.setAdminUsername(adminUsername);
        doubt.setSubject(subject);
        doubt.setQuestion(question);
        doubt.setStatus("PENDING");
        doubt.setCreatedAt(LocalDateTime.now());
        return doubtRepository.save(doubt);
    }

    public List<Doubt> getDoubtsForStudent(String studentUsername) {
        return doubtRepository.findByStudentUsernameOrderByCreatedAtDesc(studentUsername);
    }

    public List<Doubt> getDoubtsForAdmin(String adminUsername) {
        return doubtRepository.findByAdminUsernameOrderByCreatedAtDesc(adminUsername);
    }

    public Doubt replyToDoubt(Long doubtId, String adminUsername, String reply) {
        if (reply == null || reply.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply cannot be empty");
        }

        Doubt doubt = doubtRepository.findById(doubtId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doubt not found"));

        if (!doubt.getAdminUsername().equalsIgnoreCase(adminUsername)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the selected admin can reply to this doubt");
        }

        doubt.setReply(reply);
        doubt.setStatus("ANSWERED");
        doubt.setAnsweredAt(LocalDateTime.now());
        return doubtRepository.save(doubt);
    }
}
