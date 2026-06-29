package com.test;

import com.test.Entity.User;
import com.test.Repository.UseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInit implements CommandLineRunner {

    @Autowired
    private UseRepository useRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (useRepository.findByUsername("superadmin").isEmpty()) {
            User superAdmin = new User();
            superAdmin.setUsername("superadmin");
            superAdmin.setPassword(passwordEncoder.encode("superadmin123"));
            superAdmin.setRole("SUPER_ADMIN");
            superAdmin.setStatus("APPROVED");
            useRepository.save(superAdmin);
            System.out.println("Super admin created");

        }
    }
}
