package com.fas.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtTokenProvider: Sinh và thẩm định JSON Web Token (HMAC-SHA256).
 * Phục vụ xác thực không trạng thái (Stateless) theo FND-BE-004.
 */
@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey key;
    private final long expirationMillis;

    public JwtTokenProvider(
            @Value("${fas.security.jwt-secret}") String jwtSecret,
            @Value("${fas.security.jwt-expiration-hours:1}") long expirationHours) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình fas.security.jwt-secret (JWT_SECRET)");
        }
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                    "fas.security.jwt-secret phải có độ dài tối thiểu 32 byte để đủ mạnh cho HMAC-SHA256");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMillis = expirationHours * 3600 * 1000;
    }

    /**
     * Sinh JWT Token cho người dùng kèm vai trò (Role).
     */
    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    /**
     * Thẩm định tính hợp lệ và thời hạn của JWT Token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.warn("JWT Token đã hết hạn: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT Token không hợp lệ: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Trích xuất username (subject) từ JWT Token.
     */
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    /**
     * Trích xuất vai trò (Role) từ JWT Token.
     */
    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }
}
