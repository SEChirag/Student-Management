package com.test.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final String secret;
    private final Key key;
    private final JwtParser parser;

    public JwtUtil(@Value("${jwt.secret:mysecretkeymysecretkeymysecretkey123456}") String secret) {
        this.secret = (secret != null && secret.length() >= 32) ? secret : "mysecretkeymysecretkeymysecretkey123456";
        this.key = Keys.hmacShaKeyFor(this.secret.getBytes());
        this.parser = Jwts.parserBuilder().setSigningKey(this.key).build();
    }

    // Generate Token
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Extract username
    public String extractUsername(String token) {
        return parser.parseClaimsJws(token).getBody().getSubject();
    }

    // Validate token
    public boolean validateToken(String token) {
        try {
            parser.parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractRole(String token) {
        return (String) parser.parseClaimsJws(token).getBody().get("role");
    }
}
