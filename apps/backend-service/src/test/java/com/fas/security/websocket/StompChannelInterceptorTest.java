package com.fas.security.websocket;

import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import com.fas.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho {@link StompChannelInterceptor}
 * (TASK-BE-021, BLD-BE-008, APD-BE-005, DD-BE-011).
 */
@ExtendWith(MockitoExtension.class)
class StompChannelInterceptorTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private StompChannelInterceptor interceptor;

    private Kiosk activeKiosk;

    @BeforeEach
    void setUp() {
        activeKiosk = Kiosk.builder()
                .id("KIOSK-HN-01")
                .locationName("Sảnh Tòa Nhà Hà Nội")
                .secretTokenHash("$2a$12$hashedSecretKey123")
                .isActive(true)
                .build();
    }

    private Message<?> createStompMessage(StompCommand command, Principal user, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setLeaveMutable(true);
        if (user != null) {
            accessor.setUser(user);
        }
        if (destination != null) {
            accessor.setDestination(destination);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Message<?> createConnectMessage(String authHeader, String kioskId, String kioskSecret) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        if (authHeader != null) {
            accessor.setNativeHeader("Authorization", authHeader);
        }
        if (kioskId != null) {
            accessor.setNativeHeader("X-Kiosk-Id", kioskId);
        }
        if (kioskSecret != null) {
            accessor.setNativeHeader("X-Kiosk-Secret", kioskSecret);
        }
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    private Principal createPrincipal(String name, String role) {
        return new UsernamePasswordAuthenticationToken(
                name,
                null,
                List.of(new SimpleGrantedAuthority(role))
        );
    }

    @Nested
    @DisplayName("1. Thẩm định kết nối (Frame CONNECT)")
    class ConnectAuthenticationTests {

        @Test
        @DisplayName("Xác thực Web Client thành công với Bearer JWT hợp lệ")
        void connect_ValidJwt_Success() {
            String token = "valid.jwt.token";
            when(jwtTokenProvider.validateToken(token)).thenReturn(true);
            when(jwtTokenProvider.getUsernameFromToken(token)).thenReturn("hr.manager@fas.com");
            when(jwtTokenProvider.getRoleFromToken(token)).thenReturn("HR_MANAGER");

            Message<?> message = createConnectMessage("Bearer " + token, null, null);
            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
            assertThat(accessor.getUser()).isNotNull();
            assertThat(accessor.getUser().getName()).isEqualTo("hr.manager@fas.com");

            Authentication auth = (Authentication) accessor.getUser();
            assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_HR_MANAGER");
        }

        @Test
        @DisplayName("Xác thực Web Client thất bại khi JWT token không hợp lệ hoặc hết hạn")
        void connect_InvalidJwt_ThrowsAccessDeniedException() {
            String token = "expired.jwt.token";
            when(jwtTokenProvider.validateToken(token)).thenReturn(false);

            Message<?> message = createConnectMessage("Bearer " + token, null, null);

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("JWT Token không hợp lệ");
        }

        @Test
        @DisplayName("Xác thực Trạm Kiosk thành công với X-Kiosk-Id và X-Kiosk-Secret chính xác")
        void connect_ValidKioskCredentials_Success() {
            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(passwordEncoder.matches("rawSecret123", activeKiosk.getSecretTokenHash())).thenReturn(true);

            Message<?> message = createConnectMessage(null, "KIOSK-HN-01", "rawSecret123");
            Message<?> result = interceptor.preSend(message, messageChannel);

            assertThat(result).isNotNull();
            StompHeaderAccessor accessor = StompHeaderAccessor.wrap(result);
            assertThat(accessor.getUser()).isNotNull();
            assertThat(accessor.getUser().getName()).isEqualTo("KIOSK:KIOSK-HN-01");

            Authentication auth = (Authentication) accessor.getUser();
            assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_KIOSK");
        }

        @Test
        @DisplayName("Xác thực Trạm Kiosk thất bại khi Kiosk ID không tồn tại hoặc đã vô hiệu hóa")
        void connect_KioskNotFoundOrInactive_ThrowsAccessDeniedException() {
            when(kioskRepository.findByIdAndIsActiveTrue("UNKNOWN-KIOSK")).thenReturn(Optional.empty());

            Message<?> message = createConnectMessage(null, "UNKNOWN-KIOSK", "secret");

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("không tồn tại hoặc đã bị vô hiệu hóa");
        }

        @Test
        @DisplayName("Xác thực Trạm Kiosk thất bại khi sai mã bí mật X-Kiosk-Secret")
        void connect_WrongKioskSecret_ThrowsAccessDeniedException() {
            when(kioskRepository.findByIdAndIsActiveTrue("KIOSK-HN-01")).thenReturn(Optional.of(activeKiosk));
            when(passwordEncoder.matches("wrongSecret", activeKiosk.getSecretTokenHash())).thenReturn(false);

            Message<?> message = createConnectMessage(null, "KIOSK-HN-01", "wrongSecret");

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Mã bí mật của trạm Kiosk không chính xác");
        }

        @Test
        @DisplayName("Xác thực thất bại khi không cung cấp thông tin xác thực nào")
        void connect_MissingAllCredentials_ThrowsAccessDeniedException() {
            Message<?> message = createConnectMessage(null, null, null);

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("Yêu cầu thông tin xác thực để kết nối WebSocket");
        }
    }

    @Nested
    @DisplayName("2. Phân quyền đăng ký lắng nghe (Frame SUBSCRIBE)")
    class SubscribeAuthorizationTests {

        @Test
        @DisplayName("Từ chối subscribe khi phiên làm việc chưa xác thực (user null)")
        void subscribe_UnauthenticatedUser_ThrowsAccessDeniedException() {
            Message<?> message = createStompMessage(StompCommand.SUBSCRIBE, null, "/topic/live-attendance");

            assertThatThrownBy(() -> interceptor.preSend(message, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("chưa được xác thực");
        }

        @Test
        @DisplayName("/topic/live-attendance: Cho phép HR_MANAGER và ADMIN subscribe")
        void subscribe_LiveAttendance_HrAndAdminAllowed() {
            Principal hrUser = createPrincipal("hr@fas.com", "ROLE_HR_MANAGER");
            Message<?> hrMsg = createStompMessage(StompCommand.SUBSCRIBE, hrUser, "/topic/live-attendance");
            assertThat(interceptor.preSend(hrMsg, messageChannel)).isNotNull();

            Principal adminUser = createPrincipal("admin@fas.com", "ROLE_ADMIN");
            Message<?> adminMsg = createStompMessage(StompCommand.SUBSCRIBE, adminUser, "/topic/live-attendance");
            assertThat(interceptor.preSend(adminMsg, messageChannel)).isNotNull();
        }

        @Test
        @DisplayName("/topic/live-attendance: Từ chối EMPLOYEE và KIOSK subscribe")
        void subscribe_LiveAttendance_EmployeeAndKioskDenied() {
            Principal employeeUser = createPrincipal("emp@fas.com", "ROLE_EMPLOYEE");
            Message<?> empMsg = createStompMessage(StompCommand.SUBSCRIBE, employeeUser, "/topic/live-attendance");
            assertThatThrownBy(() -> interceptor.preSend(empMsg, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("yêu cầu quyền HR_MANAGER hoặc ADMIN");

            Principal kioskUser = createPrincipal("KIOSK:01", "ROLE_KIOSK");
            Message<?> kioskMsg = createStompMessage(StompCommand.SUBSCRIBE, kioskUser, "/topic/live-attendance");
            assertThatThrownBy(() -> interceptor.preSend(kioskMsg, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("yêu cầu quyền HR_MANAGER hoặc ADMIN");
        }

        @Test
        @DisplayName("/topic/kiosk-gallery: Cho phép KIOSK và ADMIN subscribe")
        void subscribe_KioskGallery_KioskAndAdminAllowed() {
            Principal kioskUser = createPrincipal("KIOSK:01", "ROLE_KIOSK");
            Message<?> kioskMsg = createStompMessage(StompCommand.SUBSCRIBE, kioskUser, "/topic/kiosk-gallery");
            assertThat(interceptor.preSend(kioskMsg, messageChannel)).isNotNull();

            Principal adminUser = createPrincipal("admin@fas.com", "ROLE_ADMIN");
            Message<?> adminMsg = createStompMessage(StompCommand.SUBSCRIBE, adminUser, "/topic/kiosk-gallery");
            assertThat(interceptor.preSend(adminMsg, messageChannel)).isNotNull();
        }

        @Test
        @DisplayName("/topic/kiosk-gallery: Từ chối EMPLOYEE và HR_MANAGER subscribe (chống rò rỉ vector)")
        void subscribe_KioskGallery_EmployeeAndHrDenied() {
            Principal employeeUser = createPrincipal("emp@fas.com", "ROLE_EMPLOYEE");
            Message<?> empMsg = createStompMessage(StompCommand.SUBSCRIBE, employeeUser, "/topic/kiosk-gallery");
            assertThatThrownBy(() -> interceptor.preSend(empMsg, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("chỉ dành cho trạm Kiosk hoặc ADMIN");

            Principal hrUser = createPrincipal("hr@fas.com", "ROLE_HR_MANAGER");
            Message<?> hrMsg = createStompMessage(StompCommand.SUBSCRIBE, hrUser, "/topic/kiosk-gallery");
            assertThatThrownBy(() -> interceptor.preSend(hrMsg, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("chỉ dành cho trạm Kiosk hoặc ADMIN");
        }

        @Test
        @DisplayName("/topic/enrollment/{otp}: Cho phép người dùng Web subscribe, từ chối KIOSK")
        void subscribe_Enrollment_WebAllowed_KioskDenied() {
            Principal employeeUser = createPrincipal("emp@fas.com", "ROLE_EMPLOYEE");
            Message<?> empMsg = createStompMessage(StompCommand.SUBSCRIBE, employeeUser, "/topic/enrollment/987654");
            assertThat(interceptor.preSend(empMsg, messageChannel)).isNotNull();

            Principal kioskUser = createPrincipal("KIOSK:01", "ROLE_KIOSK");
            Message<?> kioskMsg = createStompMessage(StompCommand.SUBSCRIBE, kioskUser, "/topic/enrollment/987654");
            assertThatThrownBy(() -> interceptor.preSend(kioskMsg, messageChannel))
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("chỉ dành cho người dùng Web Portal");
        }
    }

    @Nested
    @DisplayName("3. Các frame STOMP khác")
    class OtherFramesTests {

        @Test
        @DisplayName("Frame SEND hoặc DISCONNECT không bị can thiệp")
        void sendOrDisconnect_PassThrough() {
            Principal user = createPrincipal("user@fas.com", "ROLE_EMPLOYEE");
            Message<?> sendMsg = createStompMessage(StompCommand.SEND, user, "/app/ping");
            assertThat(interceptor.preSend(sendMsg, messageChannel)).isNotNull();

            Message<?> disconnectMsg = createStompMessage(StompCommand.DISCONNECT, user, null);
            assertThat(interceptor.preSend(disconnectMsg, messageChannel)).isNotNull();
        }
    }
}
