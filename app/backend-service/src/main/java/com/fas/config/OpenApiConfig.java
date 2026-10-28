package com.fas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
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

    /**
     * Tự động đăng ký các mã phản hồi lỗi tiêu chuẩn (400, 401, 403, 404, 409, 500)
     * cho toàn bộ các operations nhằm đảm bảo đặc tả OpenAPI phản ánh đầy đủ hợp đồng API.
     */
    @Bean
    public OpenApiCustomizer globalResponsesCustomizer() {
        return openApi -> {
            if (openApi.getPaths() != null) {
                openApi.getPaths().values().forEach(pathItem -> {
                    pathItem.readOperations().forEach(operation -> {
                        ApiResponses responses = operation.getResponses();
                        if (responses != null) {
                            if (!responses.containsKey("400")) {
                                responses.addApiResponse("400", new ApiResponse()
                                        .description("Dữ liệu không hợp lệ (RFC 7807 ProblemDetails / VALIDATION_FAILED)"));
                            }
                            if (!responses.containsKey("401")) {
                                responses.addApiResponse("401", new ApiResponse()
                                        .description("Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)"));
                            }
                            if (!responses.containsKey("403")) {
                                responses.addApiResponse("403", new ApiResponse()
                                        .description("Không đủ quyền truy cập (ACCESS_DENIED)"));
                            }
                            if (!responses.containsKey("404")) {
                                responses.addApiResponse("404", new ApiResponse()
                                        .description("Không tìm thấy tài nguyên (RESOURCE_NOT_FOUND)"));
                            }
                            if (!responses.containsKey("409")) {
                                responses.addApiResponse("409", new ApiResponse()
                                        .description("Xung đột dữ liệu hoặc bản ghi đã tồn tại (CONFLICT)"));
                            }
                            if (!responses.containsKey("500")) {
                                responses.addApiResponse("500", new ApiResponse()
                                        .description("Lỗi hệ thống nội bộ (INTERNAL_SERVER_ERROR)"));
                            }
                        }
                    });
                });
            }
        };
    }
}
