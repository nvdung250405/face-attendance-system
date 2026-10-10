package com.fas.service.audit;

import com.fas.data.entity.AuditLog;
import com.fas.data.entity.User;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Optional;

/**
 * Dịch vụ Quản lý & Trích xuất Ngữ cảnh Kiểm toán Bất biến (SOL-BE-007, DD-BE-002, ARC-006).
 */
@Slf4j
@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AuditService(
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            ObjectMapper objectMapper
    ) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Ghi nhận một sự kiện kiểm toán bất biến vào bảng audit_logs.
     * Sử dụng Propagation.REQUIRED để gắn kết với transaction nghiệp vụ hiện tại.
     *
     * @param action      hành vi kiểm toán
     * @param entityType  loại thực thể
     * @param entityId    mã định danh thực thể
     * @param beforeState trạng thái trước chỉnh sửa
     * @param afterState  trạng thái sau chỉnh sửa
     * @return bản ghi AuditLog đã lưu
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public AuditLog logAudit(
            String action,
            String entityType,
            String entityId,
            Object beforeState,
            Object afterState
    ) {
        ActorContext actorContext = resolveCurrentActor();
        String ipAddress = resolveClientIpAddress();

        String beforeStateJson = serializeStateToJson(beforeState);
        String afterStateJson = serializeStateToJson(afterState);

        AuditLog auditLog = AuditLog.builder()
                .actor(actorContext.user())
                .actorEmail(actorContext.email())
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .beforeState(beforeStateJson)
                .afterState(afterStateJson)
                .ipAddress(ipAddress)
                .createdAt(Instant.now())
                .build();

        AuditLog saved = auditLogRepository.save(auditLog);
        log.info("Đã ghi vết kiểm toán: Action={}, EntityType={}, EntityId={}, Actor={}",
                action, entityType, entityId, actorContext.email());
        return saved;
    }

    /**
     * Trích xuất thông tin người dùng đang thực hiện yêu cầu từ Spring Security Context.
     */
    public ActorContext resolveCurrentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return new ActorContext(null, "SYSTEM");
        }

        String principalName = auth.getName();
        if (!StringUtils.hasText(principalName)) {
            return new ActorContext(null, "SYSTEM");
        }

        // Tra cứu thực thể User theo email hoặc employeeCode
        Optional<User> userOpt = userRepository.findByEmail(principalName);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByEmployeeCode(principalName);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return new ActorContext(user, user.getEmail() != null ? user.getEmail() : principalName);
        }

        return new ActorContext(null, principalName);
    }

    /**
     * Trích xuất địa chỉ IP của Client từ Request Context hiện tại.
     * Hỗ trợ giải mã các header proxy như X-Forwarded-For, X-Real-IP.
     */
    public String resolveClientIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return "127.0.0.1";
            }

            HttpServletRequest request = attributes.getRequest();
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (StringUtils.hasText(xForwardedFor)) {
                // X-Forwarded-For có thể chứa danh sách proxy: client, proxy1, proxy2
                String clientIp = xForwardedFor.split(",")[0].trim();
                if (StringUtils.hasText(clientIp)) {
                    return clientIp;
                }
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (StringUtils.hasText(xRealIp)) {
                return xRealIp.trim();
            }

            String remoteAddr = request.getRemoteAddr();
            return StringUtils.hasText(remoteAddr) ? remoteAddr : "127.0.0.1";
        } catch (Exception e) {
            log.debug("Không thể trích xuất IP từ RequestContextHolder: {}", e.getMessage());
            return "127.0.0.1";
        }
    }

    /**
     * Chuyển đổi đối tượng trạng thái sang chuỗi JSON an toàn.
     */
    public String serializeStateToJson(Object state) {
        if (state == null) {
            return null;
        }
        if (state instanceof String str) {
            return str;
        }
        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception e) {
            log.warn("Không thể serialize trạng thái kiểm toán sang JSON: {}", e.getMessage());
            return String.valueOf(state);
        }
    }

    /**
     * Bản ghi chứa thông tin tác nhân thao tác.
     */
    public record ActorContext(User user, String email) {
    }
}
