package com.fas.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;

import static org.assertj.core.api.Assertions.assertThat;

class CustomAuthenticationEntryPointTest {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final CustomAuthenticationEntryPoint entryPoint = new CustomAuthenticationEntryPoint(objectMapper);

    @Test
    @DisplayName("SEC-002: CustomAuthenticationEntryPoint trả về RFC 9457 ProblemDetail JSON với Content-Type application/problem+json")
    void commence_ShouldReturnRfc9457ProblemDetail() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        entryPoint.commence(request, response, new BadCredentialsException("Token hết hạn hoặc không hợp lệ"));

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentType()).startsWith("application/problem+json");

        JsonNode jsonNode = objectMapper.readTree(response.getContentAsString());
        assertThat(jsonNode.path("status").asInt()).isEqualTo(401);
        assertThat(jsonNode.path("title").asText()).isEqualTo("Chưa xác thực");
        String code = jsonNode.has("code") ? jsonNode.path("code").asText() : jsonNode.path("properties").path("code").asText();
        assertThat(code).isEqualTo("UNAUTHORIZED");
        assertThat(jsonNode.path("detail").asText()).isEqualTo("Token hết hạn hoặc không hợp lệ");
        assertThat(jsonNode.path("instance").asText()).isEqualTo("/api/v1/admin/users");
        boolean hasTimestamp = jsonNode.has("timestamp") || jsonNode.path("properties").has("timestamp");
        assertThat(hasTimestamp).isTrue();
    }
}
