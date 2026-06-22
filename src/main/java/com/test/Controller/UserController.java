package com.test.Controller;


import com.test.Entity.Model;
import com.test.Repository.UseRepository;
import com.test.Repository.repository;
import com.test.Service.StudentService;
import com.test.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/user")
@PreAuthorize("hasAnyRole('USER','ADMIN')")
public class UserController {

    @Autowired
    private repository repo;

    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private StudentService service;
    @GetMapping("/profile")
    public String profile(Authentication authentication){
        return "Welcome "+authentication.getName();
    }
    @GetMapping("/marks")
    public  String marks(Model model){
        return "your marks -> "+model.getMarks();
    }
    @GetMapping("/me")
    public Optional<Model> me(Authentication authentication) {

        String username = authentication.getName();

        return repo.findByUsername(username);
    }
}
