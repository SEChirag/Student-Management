package com.test.Service;

import com.test.Entity.User;
import com.test.Repository.UseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class SuperadminService {
    private final UseRepository repo;

    public SuperadminService(UseRepository repo) {
        this.repo = repo;
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

    public List<User> getPendingUsers() {
        return repo.findByStatus("PENDING");
    }

    public List<User> getAllUsers() {
        return repo.findAll().stream().sorted(Comparator.comparing(User::getUsername)).toList();
    }
}
