package com.test.Controller;



import com.test.Entity.User;
import com.test.Service.AuthService;
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
    private final AuthService authService;

    public SuperadminController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        return ResponseEntity.ok(authService.getPendingUsers());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(authService.getAllUsersExcludingSuperAdmin());
    }

    @PatchMapping("/approve/{id}")
    public ResponseEntity<String> approveUser(@PathVariable long id) {
        return ResponseEntity.ok(authService.approveUser(id));
    }

    @PatchMapping("/reject/{id}")
    public ResponseEntity<String> rejectUser(@PathVariable long id) {
        return ResponseEntity.ok(authService.rejectUser(id));
    }
@GetMapping("/Rejected")
    public  ResponseEntity<List<User>> getRejectedUsers() {
        return ResponseEntity.ok(authService.getRejectedUsers());
}
@GetMapping("/Approved")
    public   ResponseEntity<List<User>> getApprovedUsers() {
        return ResponseEntity.ok(authService.getApprovedUsers());
}
@DeleteMapping("/DeleteUser/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable long id) {
    authService.deleteUser(id);
    return ResponseEntity.ok("User Deleted successfully");
}
@GetMapping("/{name}")
    public  ResponseEntity<User> getUser(@PathVariable String name) {
        return ResponseEntity.ok(authService.getUser(name));
}
}
