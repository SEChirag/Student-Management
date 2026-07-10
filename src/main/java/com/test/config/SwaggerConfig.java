package com.test.config;


import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "oauth2Password";
        return new OpenAPI()
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.OAUTH2)
                                        .flows(new io.swagger.v3.oas.models.security.OAuthFlows()
                                                .password(new io.swagger.v3.oas.models.security.OAuthFlow()
                                                        .tokenUrl("/auth/oauth/token")))))
                .info(new io.swagger.v3.oas.models.info.Info()
                        .title("Campus Student Dashboard API")
                        .version("1.0")
                        .description("REST API for student management, assignments, and auth"));
    }
}