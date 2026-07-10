package com.test.AuthController;

import com.test.Entity.*;
import com.test.Service.AuthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        return ResponseEntity.ok(authService.register(user));
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
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

    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody StudentProfile profile) {
        return ResponseEntity.ok(authService.saveProfile(profile));
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<StudentProfile> getProfile(@PathVariable String username) {
        return authService.getProfile(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(authService.getMe(authHeader));
    }

    @PostMapping("/oauth/token")
    public Map<String, String> oauthToken(@RequestParam String username, @RequestParam String password) {
        return authService.oauthToken(username, password);
    }
}