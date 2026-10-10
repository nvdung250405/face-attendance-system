package com.fas.service;

import com.fas.api.dto.response.NotificationResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.Notification;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.enums.Role;
import com.fas.data.repository.NotificationRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho NotificationService (SOL-BE-027, FR-BE-024, BLD-BE-032, TASK-BE-037).
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    private final Instant fixedInstant = Instant.parse("2026-10-10T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));

    private NotificationService notificationService;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, userRepository, fixedClock);

        sampleUser = User.builder()
                .id(100L)
                .employeeCode("EMP001")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("Tạo thông báo trong ứng dụng")
    class CreateNotificationTests {

        @Test
        @DisplayName("Tạo thông báo thành công khi user tồn tại")
        void createNotification_success() {
            when(userRepository.findById(100L)).thenReturn(Optional.of(sampleUser));
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
                Notification saved = inv.getArgument(0);
                saved.setId(1L);
                return saved;
            });

            NotificationResponse response = notificationService.createNotification(
                    100L,
                    NotificationEventType.EXCUSE_REQUEST_DECIDED,
                    "Đơn giải trình đã duyệt",
                    "Đơn xin phép ngày 10/10/2026 đã được duyệt",
                    "EXCUSE_REQUEST",
                    "55"
            );

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(1L);
            assertThat(response.userId()).isEqualTo(100L);
            assertThat(response.eventType()).isEqualTo(NotificationEventType.EXCUSE_REQUEST_DECIDED);
            assertThat(response.title()).isEqualTo("Đơn giải trình đã duyệt");
            assertThat(response.referenceType()).isEqualTo("EXCUSE_REQUEST");
            assertThat(response.referenceId()).isEqualTo("55");
            assertThat(response.readAt()).isNull();
            assertThat(response.createdAt()).isEqualTo(fixedInstant);
            verify(notificationRepository).save(any(Notification.class));
        }

        @Test
        @DisplayName("Ném lỗi khi người nhận không tồn tại")
        void createNotification_userNotFound_throwsException() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.createNotification(
                    999L,
                    NotificationEventType.PIN_LOCKED,
                    "Tiêu đề",
                    "Nội dung",
                    null,
                    null
            ))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

            verify(notificationRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Tra cứu thông báo & đếm số lượng chưa đọc")
    class QueryNotificationTests {

        @Test
        @DisplayName("Tra cứu danh sách thông báo theo phân trang")
        void getUserNotifications_success() {
            when(userRepository.existsById(100L)).thenReturn(true);

            Notification notif = Notification.builder()
                    .id(1L)
                    .user(sampleUser)
                    .eventType(NotificationEventType.ACCOUNT_CREATED)
                    .title("Tài khoản đã tạo")
                    .createdAt(fixedInstant)
                    .build();

            Pageable pageable = PageRequest.of(0, 10);
            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(100L, pageable))
                    .thenReturn(new PageImpl<>(List.of(notif), pageable, 1));

            Page<NotificationResponse> result = notificationService.getUserNotifications(100L, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).title()).isEqualTo("Tài khoản đã tạo");
        }

        @Test
        @DisplayName("Tra cứu thất bại khi nhân viên không tồn tại")
        void getUserNotifications_userNotFound_throwsException() {
            when(userRepository.existsById(999L)).thenReturn(false);

            Pageable pageable = PageRequest.of(0, 10);
            assertThatThrownBy(() -> notificationService.getUserNotifications(999L, pageable))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }

        @Test
        @DisplayName("Đếm số lượng thông báo chưa đọc")
        void getUnreadCount_success() {
            when(userRepository.existsById(100L)).thenReturn(true);
            when(notificationRepository.countByUserIdAndReadAtIsNull(100L)).thenReturn(3L);

            long count = notificationService.getUnreadCount(100L);
            assertThat(count).isEqualTo(3L);
        }
    }

    @Nested
    @DisplayName("Đánh dấu đã đọc")
    class MarkAsReadTests {

        @Test
        @DisplayName("Đánh dấu một thông báo đã đọc thành công")
        void markAsRead_success() {
            Notification notif = Notification.builder()
                    .id(1L)
                    .user(sampleUser)
                    .eventType(NotificationEventType.PAYROLL_PERIOD_LOCKED)
                    .title("Kỳ công đã chốt")
                    .readAt(null)
                    .createdAt(fixedInstant)
                    .build();

            when(notificationRepository.findById(1L)).thenReturn(Optional.of(notif));
            when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

            NotificationResponse response = notificationService.markAsRead(1L, 100L);

            assertThat(response.readAt()).isEqualTo(fixedInstant);
            verify(notificationRepository).save(notif);
        }

        @Test
        @DisplayName("Ném lỗi nếu thông báo không thuộc về nhân viên yêu cầu")
        void markAsRead_notOwner_throwsException() {
            User otherUser = User.builder().id(200L).build();
            Notification notif = Notification.builder()
                    .id(1L)
                    .user(otherUser)
                    .build();

            when(notificationRepository.findById(1L)).thenReturn(Optional.of(notif));

            assertThatThrownBy(() -> notificationService.markAsRead(1L, 100L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đánh dấu tất cả thông báo của nhân viên đã đọc")
        void markAllAsRead_success() {
            when(userRepository.existsById(100L)).thenReturn(true);

            Notification n1 = Notification.builder().id(1L).user(sampleUser).readAt(null).build();
            Notification n2 = Notification.builder().id(2L).user(sampleUser).readAt(null).build();

            when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(100L), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(n1, n2)));

            notificationService.markAllAsRead(100L);

            verify(notificationRepository).saveAll(argThat(iterable -> {
                List<Notification> list = (List<Notification>) iterable;
                return list.size() == 2 && list.stream().allMatch(n -> n.getReadAt() != null);
            }));
        }
    }
}
