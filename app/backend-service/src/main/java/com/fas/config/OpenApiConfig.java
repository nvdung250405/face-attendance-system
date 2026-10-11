package com.fas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình OpenAPI 3.0 / Swagger UI cho backend-service.
 * Hỗ trợ xác thực Bearer JWT trực tiếp trên Swagger UI Console.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Face Attendance System API")
                        .version("1.0.0")
                        .description("Tài liệu đặc tả REST API cho Hệ thống Điểm danh Khuôn mặt (Face Attendance System)")
                        .contact(new Contact()
                                .name("Engineering Team")
                                .email("dev@fas.local"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://fas.local/license")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Bearer Token nhận được từ /api/v1/auth/login")));
    }
}
