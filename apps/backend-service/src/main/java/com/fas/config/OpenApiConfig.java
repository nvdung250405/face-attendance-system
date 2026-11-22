package com.fas.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.headers.Header;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.media.ArraySchema;
import io.swagger.v3.oas.models.media.BooleanSchema;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.IntegerSchema;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.ObjectSchema;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.media.StringSchema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.oas.models.parameters.QueryParameter;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Cấu hình OpenAPI 3.0 / Swagger UI cho backend-service.
 * Chuẩn hóa theo RFC 9457 ProblemDetails, phân rã Query Parameters (Pageable/Criteria)
 * và bảo vệ xác thực Bearer JWT trên Swagger UI Console.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";
    private static final String PROBLEM_DETAILS_REF = "#/components/schemas/ProblemDetails";
    private static final String APPLICATION_PROBLEM_JSON = "application/problem+json";
    private static final String APPLICATION_JSON = "application/json";

    private static final Set<String> RATE_LIMITED_PATHS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/kiosk/verify-pin",
            "/api/v1/kiosk/verify-otp",
            "/api/v1/kiosk/punch",
            "/api/v1/employee/pin/reset"
    );

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .openapi("3.0.3")
                .servers(List.of(new Server().url("/").description("Base API Gateway Endpoint")))
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
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Bearer Token nhận được từ /api/v1/auth/login")));
    }

    /**
     * Tự động chuẩn hóa:
     * 1. Toàn bộ mã phản hồi lỗi (400, 401, 403, 404, 409, 500) mang schema ProblemDetails chuẩn RFC 9457.
     * 2. Bổ sung mã 429 Too Many Requests kèm header Retry-After cho các endpoint nhạy cảm brute-force.
     * 3. Thay thế kiểu wildcard (*\/*) bằng application/json cho phản hồi thành công.
     * 4. Phân rã tham số truy vấn (Pageable, Criteria) thành các scalar params tường minh.
     * 5. Bổ sung summary tự động nếu thiếu.
     */
    @Bean
    public OpenApiCustomizer globalResponsesCustomizer() {
        return openApi -> {
            openApi.setOpenapi("3.0.3");

            if (openApi.getComponents() == null) {
                openApi.setComponents(new Components());
            }
            openApi.getComponents().addSchemas("InvalidParam", createInvalidParamSchema());
            openApi.getComponents().addSchemas("ProblemDetails", createProblemDetailsSchema());

            Content problemContent = new Content()
                    .addMediaType(APPLICATION_PROBLEM_JSON,
                            new MediaType().schema(new Schema<>().$ref(PROBLEM_DETAILS_REF)));

            ApiResponse rateLimitResponse = new ApiResponse()
                    .description("Quá giới hạn tần suất yêu cầu (RFC 6585 Too Many Requests / RATE_LIMIT_EXCEEDED)")
                    .content(problemContent)
                    .addHeaderObject("Retry-After", new Header()
                            .description("Số giây cần chờ trước khi thử lại yêu cầu tiếp theo")
                            .schema(new IntegerSchema().example(60)));

            if (openApi.getPaths() != null) {
                openApi.getPaths().forEach((path, pathItem) -> {
                    pathItem.readOperationsMap().forEach((httpMethod, operation) -> {
                        enrichOperationSummary(operation, httpMethod.name(), path);
                        enrichOperationResponses(operation, problemContent, rateLimitResponse, path);
                        flattenOperationParameters(operation);
                    });
                });
            }

            // Loại bỏ các schemas criteria / pageable không còn được tham chiếu trực tiếp
            if (openApi.getComponents() != null && openApi.getComponents().getSchemas() != null) {
                openApi.getComponents().getSchemas().remove("Pageable");
                openApi.getComponents().getSchemas().remove("EmployeeSearchCriteria");
                openApi.getComponents().getSchemas().remove("AttendanceSearchCriteria");
                openApi.getComponents().getSchemas().remove("AuditLogFilterCriteria");
            }
        };
    }

    private Schema<?> createInvalidParamSchema() {
        return new ObjectSchema()
                .description("Chi tiết một trường dữ liệu vi phạm ràng buộc validation")
                .addProperty("field", new StringSchema().description("Tên trường hoặc tham số vi phạm").example("punchTimestamp"))
                .addProperty("reason", new StringSchema().description("Diễn giải lý do vi phạm ràng buộc").example("punchTimestamp không được để trống"));
    }

    private Schema<?> createProblemDetailsSchema() {
        return new ObjectSchema()
                .description("Cấu trúc phản hồi lỗi chuẩn RFC 9457 (thay thế RFC 7807) ProblemDetails")
                .addProperty("type", new StringSchema().format("uri").description("URI định danh loại lỗi").example("https://fas.company.com/errors/validation-failed"))
                .addProperty("title", new StringSchema().description("Tiêu đề ngắn gọn của loại lỗi").example("Dữ liệu không hợp lệ"))
                .addProperty("status", new IntegerSchema().description("Mã trạng thái HTTP tương ứng").example(400))
                .addProperty("detail", new StringSchema().description("Chi tiết nguyên nhân lỗi cụ thể").example("Dữ liệu request không thỏa mãn ràng buộc."))
                .addProperty("instance", new StringSchema().format("uri").description("URI tài nguyên phát sinh lỗi").example("https://fas.company.com/api/v1/kiosk/punch"))
                .addProperty("code", new StringSchema().description("Mã lỗi nghiệp vụ nội bộ của FAS").example("VALIDATION_FAILED"))
                .addProperty("message", new StringSchema().description("Thông điệp diễn giải lỗi cho người dùng").example("Dữ liệu request không thỏa mãn ràng buộc."))
                .addProperty("timestamp", new StringSchema().format("date-time").description("Mốc thời gian phát sinh lỗi theo chuẩn ISO-8601 (+07:00)").example("2026-11-16T10:30:00+07:00"))
                .addProperty("invalidParams", new ArraySchema().description("Danh sách trường dữ liệu vi phạm ràng buộc (nếu có)").items(new Schema<>().$ref("#/components/schemas/InvalidParam")));
    }

    private void enrichOperationSummary(Operation operation, String method, String path) {
        if (operation.getSummary() == null || operation.getSummary().isBlank()) {
            String opId = operation.getOperationId();
            if (opId != null && !opId.isBlank()) {
                operation.setSummary(humanizeCamelCase(opId));
            } else {
                operation.setSummary(method + " " + path);
            }
        }
    }

    private void enrichOperationResponses(Operation operation, Content problemContent, ApiResponse rateLimitResponse, String path) {
        ApiResponses responses = operation.getResponses();
        if (responses == null) {
            responses = new ApiResponses();
            operation.setResponses(responses);
        }

        // Chuẩn hóa 200 / 201 media type từ */* sang application/json
        replaceWildcardMediaType(responses.get("200"));
        replaceWildcardMediaType(responses.get("201"));

        // RFC 9457 ProblemDetails cho các mã lỗi chuẩn
        enrichErrorResponse(responses, "400", "Dữ liệu không hợp lệ (RFC 9457 ProblemDetails / VALIDATION_FAILED)", problemContent);
        enrichErrorResponse(responses, "401", "Chưa xác thực hoặc token không hợp lệ (UNAUTHORIZED)", problemContent);
        enrichErrorResponse(responses, "403", "Không đủ quyền truy cập tài nguyên (ACCESS_DENIED)", problemContent);
        enrichErrorResponse(responses, "404", "Không tìm thấy tài nguyên được yêu cầu (RESOURCE_NOT_FOUND)", problemContent);
        enrichErrorResponse(responses, "409", "Xung đột dữ liệu hoặc bản ghi đã tồn tại (CONFLICT)", problemContent);
        enrichErrorResponse(responses, "500", "Lỗi hệ thống nội bộ (INTERNAL_SERVER_ERROR)", problemContent);

        // Bổ sung mã 429 trên các endpoint nhạy cảm brute-force
        if (RATE_LIMITED_PATHS.contains(path) && !responses.containsKey("429")) {
            responses.addApiResponse("429", rateLimitResponse);
        }
    }

    private void replaceWildcardMediaType(ApiResponse response) {
        if (response != null && response.getContent() != null) {
            Content content = response.getContent();
            if (content.containsKey("*/*")) {
                MediaType wildcard = content.remove("*/*");
                content.addMediaType(APPLICATION_JSON, wildcard);
            }
        }
    }

    private void enrichErrorResponse(ApiResponses responses, String statusCode, String defaultDesc, Content problemContent) {
        ApiResponse resp = responses.get(statusCode);
        if (resp == null) {
            resp = new ApiResponse().description(defaultDesc);
            responses.addApiResponse(statusCode, resp);
        }
        if (resp.getContent() == null || resp.getContent().isEmpty()) {
            resp.setContent(problemContent);
        }
    }

    private void flattenOperationParameters(Operation operation) {
        List<Parameter> parameters = operation.getParameters();
        if (parameters == null || parameters.isEmpty()) {
            return;
        }

        List<Parameter> flattened = new ArrayList<>();
        for (Parameter param : parameters) {
            if ("query".equalsIgnoreCase(param.getIn())) {
                String ref = (param.getSchema() != null) ? param.getSchema().get$ref() : null;

                if ("pageable".equalsIgnoreCase(param.getName()) || (ref != null && ref.endsWith("/Pageable"))) {
                    flattened.add(new QueryParameter()
                            .name("page")
                            .description("Số thứ tự trang (bắt đầu từ 0)")
                            .schema(new IntegerSchema()._default(0).minimum(BigDecimal.ZERO)));
                    flattened.add(new QueryParameter()
                            .name("size")
                            .description("Số lượng bản ghi trên một trang")
                            .schema(new IntegerSchema()._default(20).minimum(BigDecimal.ONE).maximum(BigDecimal.valueOf(100))));
                    flattened.add(new QueryParameter()
                            .name("sort")
                            .description("Tiêu chí sắp xếp theo định dạng: property(,asc|desc)")
                            .schema(new ArraySchema().items(new StringSchema()))
                            .explode(true));
                    continue;
                }

                if (ref != null && ref.endsWith("/EmployeeSearchCriteria")) {
                    flattened.add(new QueryParameter().name("keyword").description("Từ khóa tìm kiếm theo họ tên hoặc mã nhân viên").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("departmentId").description("Lọc theo ID phòng ban").schema(new IntegerSchema().format("int64")));
                    flattened.add(new QueryParameter().name("status").description("Lọc theo trạng thái tài khoản (ACTIVE, INACTIVE, SUSPENDED)").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("hasBiometric").description("Lọc theo trạng thái đã đăng ký khuôn mặt").schema(new BooleanSchema()));
                    flattened.add(new QueryParameter().name("shiftId").description("Lọc theo ID ca làm việc").schema(new IntegerSchema().format("int64")));
                    continue;
                }

                if (ref != null && ref.endsWith("/AttendanceSearchCriteria")) {
                    flattened.add(new QueryParameter().name("keyword").description("Từ khóa tìm kiếm theo họ tên hoặc mã nhân viên").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("departmentId").description("Lọc theo ID phòng ban").schema(new IntegerSchema().format("int64")));
                    flattened.add(new QueryParameter().name("date").description("Lọc theo ngày cụ thể (YYYY-MM-DD)").schema(new StringSchema().format("date")));
                    flattened.add(new QueryParameter().name("startDate").description("Lọc từ ngày (YYYY-MM-DD)").schema(new StringSchema().format("date")));
                    flattened.add(new QueryParameter().name("endDate").description("Lọc đến ngày (YYYY-MM-DD)").schema(new StringSchema().format("date")));
                    flattened.add(new QueryParameter().name("status").description("Lọc theo trạng thái chấm công (ON_TIME, LATE, EARLY_LEAVE, ABSENT)").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("punchType").description("Lọc theo loại chấm công (CHECK_IN, CHECK_OUT)").schema(new StringSchema()));
                    continue;
                }

                if (ref != null && ref.endsWith("/AuditLogFilterCriteria")) {
                    flattened.add(new QueryParameter().name("userId").description("Lọc theo ID người dùng thực hiện").schema(new IntegerSchema().format("int64")));
                    flattened.add(new QueryParameter().name("action").description("Lọc theo hành động thực hiện").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("status").description("Lọc theo trạng thái kết quả (SUCCESS, FAILURE)").schema(new StringSchema()));
                    flattened.add(new QueryParameter().name("startDate").description("Mốc thời gian bắt đầu (ISO-8601)").schema(new StringSchema().format("date-time")));
                    flattened.add(new QueryParameter().name("endDate").description("Mốc thời gian kết thúc (ISO-8601)").schema(new StringSchema().format("date-time")));
                    flattened.add(new QueryParameter().name("keyword").description("Từ khóa tìm kiếm trong mô tả hoặc chi tiết log").schema(new StringSchema()));
                    continue;
                }
            }
            flattened.add(param);
        }
        operation.setParameters(flattened);
    }

    private String humanizeCamelCase(String text) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (Character.isUpperCase(c) && i > 0) {
                result.append(' ');
                result.append(Character.toLowerCase(c));
            } else if (i == 0) {
                result.append(Character.toUpperCase(c));
            } else {
                result.append(c);
            }
        }
        return result.toString();
    }
}
