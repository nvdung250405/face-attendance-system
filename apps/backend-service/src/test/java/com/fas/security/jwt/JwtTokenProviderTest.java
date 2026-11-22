package com.fas.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "4a8f9c2d1e0b5a7c3e6d8f1a2b4c6e8d0f2a4b6c8e0d2f4a6b8c0d2e4f6a8b0c";

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider(secret, 8);
    }

    @Test
    @DisplayName("FND-BE-004: Sinh và giải mã JWT token thành công")
    void testGenerateAndValidateTokenSuccess() {
        String username = "admin@fas.com";
        String role = "ADMIN";

        String token = tokenProvider.generateToken(username, role);
        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));

        assertEquals(username, tokenProvider.getUsernameFromToken(token));
        assertEquals(role, tokenProvider.getRoleFromToken(token));
    }

    @Test
    @DisplayName("FND-BE-004: Từ chối JWT token bị giả mạo hoặc sai chữ ký")
    void testValidateTamperedTokenFails() {
        String token = tokenProvider.generateToken("employee@fas.com", "EMPLOYEE");
        String tamperedToken = token + "xyz";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("FND-BE-004: Từ chối JWT token ký bằng secret key khác")
    void testValidateTokenWithDifferentSecretFails() {
        JwtTokenProvider anotherProvider = new JwtTokenProvider(
                "9f8e7d6c5b4a3a2b1c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b", 8
        );
        String foreignToken = anotherProvider.generateToken("user@fas.com", "USER");

        assertFalse(tokenProvider.validateToken(foreignToken));
    }
}
