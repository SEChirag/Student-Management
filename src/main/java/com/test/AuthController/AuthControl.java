package com.test.AuthController;

import com.test.Entity.LoginRequest;
import com.test.Entity.User;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthControl {

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UseRepository repo;
    @Autowired
    private repository repository;
    @Autowired
   private PasswordEncoder passwordEncoder ;

    @PostMapping("/register")
    public String register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
    repo.save(user);

    return "User registered";
    }


    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request) {
        User user = repo.findByUsername(request.getUsername()).orElse(null);

        if(user == null){
            return "user not found";
        }
        boolean passWordMatch = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if(passWordMatch){
            return jwtUtil.generateToken(user.getUsername());
        }

        return "Invalid credentials";
    }
   @GetMapping("/logincheck")
    public String logincheck(@RequestBody LoginRequest request) {
        System.out.println("LOGIN API HIT");
        return "success";
    }
}
