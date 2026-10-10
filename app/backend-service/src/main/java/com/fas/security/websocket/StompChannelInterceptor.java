package com.fas.security.websocket;

import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import com.fas.security.jwt.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Interceptor đánh chặn các frame STOMP trên kênh Inbound của WebSocket
 * để thẩm định xác thực và phân quyền (TASK-BE-021, BLD-BE-008, APD-BE-005, DD-BE-011).
 *
 * <p>Quy trình:
 * <ol>
 *   <li><b>Frame {@code CONNECT}</b>: Thẩm định Bearer JWT Token của người dùng Web Portal
 *       hoặc {@code X-Kiosk-Id} + {@code X-Kiosk-Secret} của trạm Kiosk. Từ chối kết nối nếu thiếu hoặc sai.</li>
 *   <li><b>Frame {@code SUBSCRIBE}</b>: Phân tách và kiểm tra đặc quyền truy cập theo từng Destination:
 *     <ul>
 *       <li>{@code /topic/live-attendance}: Chỉ cho phép {@code HR_MANAGER} và {@code ADMIN}.</li>
 *       <li>{@code /topic/kiosk-gallery}: Chỉ cho phép {@code KIOSK} và {@code ADMIN}.</li>
 *       <li>{@code /topic/enrollment/**}: Cho phép người dùng Web (Employee/HR/Admin) theo dõi tiến trình nạp mẫu.</li>
 *     </ul>
 *   </li>
 * </ol>
 */
@Slf4j
@Component
public class StompChannelInterceptor implements ChannelInterceptor {

    public static final String TOPIC_LIVE_ATTENDANCE = "/topic/live-attendance";
    public static final String TOPIC_KIOSK_GALLERY = "/topic/kiosk-gallery";
    public static final String PREFIX_TOPIC_ENROLLMENT = "/topic/enrollment";

    private final JwtTokenProvider jwtTokenProvider;
    private final KioskRepository kioskRepository;
    private final PasswordEncoder passwordEncoder;

    public StompChannelInterceptor(
            JwtTokenProvider jwtTokenProvider,
            KioskRepository kioskRepository,
            PasswordEncoder passwordEncoder) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.kioskRepository = kioskRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            authorizeSubscribe(accessor);
        }

        return message;
    }

    /**
     * Thẩm định frame CONNECT: trích xuất JWT Token hoặc Kiosk Credentials.
     */
    private void authenticateConnect(StompHeaderAccessor accessor) {
        // 1. Kiểm tra JWT Bearer Token (dành cho Web Portal)
        String authHeader = getHeader(accessor, "Authorization", "authorization", "token", "X-Auth-Token");
        if (StringUtils.hasText(authHeader)) {
            String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
            if (jwtTokenProvider.validateToken(token)) {
                String username = jwtTokenProvider.getUsernameFromToken(token);
                String role = jwtTokenProvider.getRoleFromToken(token);
                String grantedRole = "ROLE_" + (StringUtils.hasText(role) ? role : "EMPLOYEE");

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(grantedRole));
                Authentication authentication = new UsernamePasswordAuthenticationToken(username, null, authorities);
                accessor.setUser(authentication);

                log.info("Xác thực thành công kết nối WebSocket người dùng: user={}, role={}", username, grantedRole);
                return;
            } else {
                log.warn("Từ chối kết nối WebSocket: JWT Token không hợp lệ hoặc đã hết hạn");
                throw new AccessDeniedException("JWT Token không hợp lệ hoặc đã hết hạn");
            }
        }

        // 2. Kiểm tra Kiosk Credentials (dành cho Kiosk Desktop)
        String kioskId = getHeader(accessor, "X-Kiosk-Id", "x-kiosk-id", "kiosk-id");
        if (StringUtils.hasText(kioskId)) {
            Optional<Kiosk> kioskOpt = kioskRepository.findByIdAndIsActiveTrue(kioskId);
            if (kioskOpt.isEmpty()) {
                log.warn("Từ chối kết nối WebSocket: Trạm Kiosk '{}' không tồn tại hoặc đã bị vô hiệu hóa", kioskId);
                throw new AccessDeniedException("Trạm Kiosk không tồn tại hoặc đã bị vô hiệu hóa: " + kioskId);
            }

            Kiosk kiosk = kioskOpt.get();
            String kioskSecret = getHeader(accessor, "X-Kiosk-Secret", "x-kiosk-secret", "kiosk-secret");

            if (StringUtils.hasText(kiosk.getSecretTokenHash())) {
                if (!StringUtils.hasText(kioskSecret) || !passwordEncoder.matches(kioskSecret, kiosk.getSecretTokenHash())) {
                    log.warn("Từ chối kết nối WebSocket: Mã bí mật của trạm Kiosk '{}' không chính xác", kioskId);
                    throw new AccessDeniedException("Mã bí mật của trạm Kiosk không chính xác: " + kioskId);
                }
            }

            List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_KIOSK"));
            Authentication authentication = new UsernamePasswordAuthenticationToken("KIOSK:" + kioskId, null, authorities);
            accessor.setUser(authentication);

            log.info("Xác thực thành công kết nối WebSocket trạm Kiosk: kioskId={}", kioskId);
            return;
        }

        // 3. Thiếu toàn bộ thông tin xác thực
        log.warn("Từ chối kết nối WebSocket: Không tìm thấy header Authorization hoặc X-Kiosk-Id");
        throw new AccessDeniedException("Yêu cầu thông tin xác thực để kết nối WebSocket (JWT Token hoặc X-Kiosk-Id)");
    }

    /**
     * Phân quyền frame SUBSCRIBE: kiểm tra vai trò đối với topic được đăng ký.
     */
    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            log.warn("Từ chối đăng ký kênh: Phiên WebSocket chưa được xác thực");
            throw new AccessDeniedException("Phiên WebSocket chưa được xác thực");
        }

        String destination = accessor.getDestination();
        if (!StringUtils.hasText(destination)) {
            return;
        }

        boolean isKiosk = hasRole(principal, "ROLE_KIOSK");
        boolean isAdmin = hasRole(principal, "ROLE_ADMIN");
        boolean isHr = hasRole(principal, "ROLE_HR_MANAGER");
        boolean isEmployee = hasRole(principal, "ROLE_EMPLOYEE");

        // 1. Phân quyền kênh /topic/live-attendance (chỉ HR_MANAGER và ADMIN)
        if (destination.startsWith(TOPIC_LIVE_ATTENDANCE)) {
            if (!isAdmin && !isHr) {
                log.warn("Từ chối truy cập: Người dùng '{}' không có quyền subscribe {}", principal.getName(), destination);
                throw new AccessDeniedException("Kênh điểm danh trực tiếp yêu cầu quyền HR_MANAGER hoặc ADMIN");
            }
            return;
        }

        // 2. Phân quyền kênh /topic/kiosk-gallery (chỉ KIOSK và ADMIN)
        if (destination.startsWith(TOPIC_KIOSK_GALLERY)) {
            if (!isKiosk && !isAdmin) {
                log.warn("Từ chối truy cập: Người dùng '{}' không có quyền subscribe {}", principal.getName(), destination);
                throw new AccessDeniedException("Kênh đồng bộ thư viện khuôn mặt chỉ dành cho trạm Kiosk hoặc ADMIN");
            }
            return;
        }

        // 3. Phân quyền kênh /topic/enrollment/** (chỉ người dùng Web Portal, không dành cho Kiosk)
        if (destination.startsWith(PREFIX_TOPIC_ENROLLMENT)) {
            if (isKiosk && !isAdmin) {
                log.warn("Từ chối truy cập: Trạm Kiosk '{}' không được phép subscribe {}", principal.getName(), destination);
                throw new AccessDeniedException("Kênh thông báo kết quả đăng ký chỉ dành cho người dùng Web Portal");
            }
            if (!isEmployee && !isHr && !isAdmin) {
                log.warn("Từ chối truy cập: Người dùng '{}' không có quyền subscribe {}", principal.getName(), destination);
                throw new AccessDeniedException("Yêu cầu đăng nhập tài khoản người dùng để theo dõi tiến trình đăng ký");
            }
            return;
        }
    }

    private boolean hasRole(Principal principal, String role) {
        if (principal instanceof Authentication auth) {
            return auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equalsIgnoreCase(role));
        }
        return false;
    }

    private String getHeader(StompHeaderAccessor accessor, String... headerNames) {
        for (String name : headerNames) {
            String val = accessor.getFirstNativeHeader(name);
            if (StringUtils.hasText(val)) {
                return val.trim();
            }
        }
        return null;
    }
}
