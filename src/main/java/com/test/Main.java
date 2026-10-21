package com.test;

import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.metamodel.Metamodel;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EntityScan(basePackages = "com.test.Entity")
@EnableJpaRepositories(basePackages = "com.test.Repository")
public class Main {
    public static void main(String[] args) {
        var ctx = SpringApplication.run(Main.class);
        System.out.println("SpringBoot application started");
        EntityManagerFactory emf = ctx.getBean(EntityManagerFactory.class);
        Metamodel metamodel = emf.getMetamodel();
        metamodel.getEntities().forEach(e -> System.out.println("ENTITY FOUND: " + e.getName()));
    }

}
