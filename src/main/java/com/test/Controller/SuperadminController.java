package com.test.Controller;


import com.test.Entity.User;
import com.test.Service.AuthService;
import com.test.Service.SuperadminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@CrossOrigin("*")
@RequestMapping("/superadmin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperadminController {
    private final SuperadminService Service;

    public SuperadminController(SuperadminService Service) {
        this.Service = Service;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        return ResponseEntity.ok(Service.getPendingUsers());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(Service.getAllUsersExcludingSuperAdmin());
    }

    @PatchMapping("/approve/{id}")
    public ResponseEntity<String> approveUser(@PathVariable long id) {
        return ResponseEntity.ok(Service.approveUser(id));
    }

    @PatchMapping("/reject/{id}")
    public ResponseEntity<String> rejectUser(@PathVariable long id) {
        return ResponseEntity.ok(Service.rejectUser(id));
    }

    @GetMapping("/Rejected")
    public ResponseEntity<List<User>> getRejectedUsers() {
        return ResponseEntity.ok(Service.getRejectedUsers());
    }

    @GetMapping("/Approved")
    public ResponseEntity<List<User>> getApprovedUsers() {
        return ResponseEntity.ok(Service.getApprovedUsers());
    }

    @DeleteMapping("/DeleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable long id) {
        Service.deleteUser(id);
        return ResponseEntity.ok("User Deleted successfully");
    }

    @GetMapping("/{name}")
    public ResponseEntity<User> getUser(@PathVariable String name) {
        return ResponseEntity.ok(Service.getUser(name));
    }
    @GetMapping("/allUser")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(Service.getAllUsers());
    }

}
