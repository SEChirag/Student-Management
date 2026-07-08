package com.test.util;


import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class CredentialGenerator {
    private static final String CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private final SecureRandom random = new SecureRandom();

    public String generateUsername(String studentName, String rollNumberFallback) {
        String base = studentName.trim().toLowerCase().replaceAll("[^a-z]", "");
        if (base.length() > 8) base = base.substring(0, 8);
        if (base.isEmpty()) base = "student";
        return base + rollNumberFallback;
    }

    public String generateTempPassword() {
        StringBuilder sb = new StringBuilder("Stu@");
        for (int i = 0; i < 8; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

}
