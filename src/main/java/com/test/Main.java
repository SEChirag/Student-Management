package com.test;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.metamodel.Metamodel;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.test.Entity")
@EnableJpaRepositories(basePackages = "com.test.Repository")
public class Main {
    public static void main(String[] args) {
        var ctx = SpringApplication.run(Main.class);
        System.out.println("SpringBoot application started");
        EntityManagerFactory emf = ctx.getBean(EntityManagerFactory.class);
        Metamodel metamodel = emf.getMetamodel();
        metamodel.getEntities().forEach(e -> System.out.println("ENTITY FOUND: " + e.getName()));
        System.out.println("MAIL_USER: " + System.getenv("MAIL_USERNAME"));
        System.out.println("MAIL_PASS length: " + (System.getenv("MAIL_PASSWORD") != null ? System.getenv("MAIL_PASSWORD").length() : "NULL"));
    }

}
