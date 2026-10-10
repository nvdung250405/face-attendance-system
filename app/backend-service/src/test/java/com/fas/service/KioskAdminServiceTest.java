package com.fas.service;

import com.fas.api.dto.request.RegisterKioskRequest;
import com.fas.api.dto.request.UpdateKioskRequest;
import com.fas.api.dto.response.KioskHealthResponse;
import com.fas.api.dto.response.KioskItemResponse;
import com.fas.api.dto.response.RegisterKioskResponse;
import com.fas.api.dto.response.RotateKioskTokenResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.Kiosk;
import com.fas.data.repository.KioskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho KioskAdminService (TASK-BE-031, BLD-BE-026, SOL-BE-020, FR-BE-017).
 */
@ExtendWith(MockitoExtension.class)
class KioskAdminServiceTest {

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private Clock fixedClock;
    private KioskAdminService kioskAdminService;

    private static final Instant NOW = Instant.parse("2026-10-10T14:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(NOW, ZONE);
        kioskAdminService = new KioskAdminService(
                kioskRepository,
                passwordEncoder,
                fixedClock
        );
    }

    @Nested
    @DisplayName("1. Đăng ký trạm Kiosk mới (registerKiosk)")
    class RegisterKioskTests {

        @Test
        @DisplayName("Đăng ký trạm thành công: sinh Secret Token, băm BCrypt, trạng thái isActive = true")
        void registerKiosk_Success() {
            RegisterKioskRequest request = new RegisterKioskRequest("KIOSK-HN-01", "Cửa chính Tòa nhà A");

            when(kioskRepository.existsById("KIOSK-HN-01")).thenReturn(false);
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashedSecretToken");
            when(kioskRepository.save(any(Kiosk.class))).thenAnswer(i -> i.getArgument(0));

            RegisterKioskResponse response = kioskAdminService.registerKiosk(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo("KIOSK-HN-01");
            assertThat(response.locationName()).isEqualTo("Cửa chính Tòa nhà A");
            assertThat(response.secretToken()).isNotBlank().hasSize(36);
            assertThat(response.createdAt()).isEqualTo(NOW);

            ArgumentCaptor<Kiosk> captor = ArgumentCaptor.forClass(Kiosk.class);
            verify(kioskRepository).save(captor.capture());
            Kiosk saved = captor.getValue();
            assertThat(saved.getId()).isEqualTo("KIOSK-HN-01");
            assertThat(saved.getSecretTokenHash()).isEqualTo("$2a$12$hashedSecretToken");
            assertThat(saved.getIsActive()).isTrue();
            assertThat(saved.getLastPingAt()).isNull();
        }

        @Test
        @DisplayName("Đăng ký trạm thất bại khi mã trạm đã tồn tại -> 409 Conflict")
        void registerKiosk_AlreadyExists_ThrowsException() {
            RegisterKioskRequest request = new RegisterKioskRequest("KIOSK-HN-01", "Cửa chính Tòa nhà A");
            when(kioskRepository.existsById("KIOSK-HN-01")).thenReturn(true);

            assertThatThrownBy(() -> kioskAdminService.registerKiosk(request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_ALREADY_EXISTS);
                    });

            verify(kioskRepository, never()).save(any());
        }

        @Test
        @DisplayName("Đăng ký trạm thất bại khi request null hoặc thiếu thông tin -> 400 Bad Request")
        void registerKiosk_InvalidRequest_ThrowsException() {
            assertThatThrownBy(() -> kioskAdminService.registerKiosk(null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });

            RegisterKioskRequest blankRequest = new RegisterKioskRequest("", "");
            assertThatThrownBy(() -> kioskAdminService.registerKiosk(blankRequest))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED);
                    });
        }
    }

    @Nested
    @DisplayName("2. Đổi khóa bí mật Secret Token (rotateSecretToken)")
    class RotateSecretTokenTests {

        private Kiosk existingKiosk;

        @BeforeEach
        void initKiosk() {
            existingKiosk = Kiosk.builder()
                    .id("KIOSK-HCM-01")
                    .locationName("Sảnh 1")
                    .secretTokenHash("$2a$12$oldHashedToken")
                    .isActive(true)
                    .createdAt(NOW.minusSeconds(86400))
                    .build();
        }

        @Test
        @DisplayName("Đổi token thành công: sinh mã mới, băm BCrypt, token cũ bị thay thế")
        void rotateSecretToken_Success() {
            when(kioskRepository.findById("KIOSK-HCM-01")).thenReturn(Optional.of(existingKiosk));
            when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$newHashedToken");
            when(kioskRepository.save(any(Kiosk.class))).thenAnswer(i -> i.getArgument(0));

            RotateKioskTokenResponse response = kioskAdminService.rotateSecretToken("KIOSK-HCM-01");

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo("KIOSK-HCM-01");
            assertThat(response.newSecretToken()).isNotBlank().hasSize(36);
            assertThat(response.rotatedAt()).isEqualTo(NOW);

            assertThat(existingKiosk.getSecretTokenHash()).isEqualTo("$2a$12$newHashedToken");
            verify(kioskRepository).save(existingKiosk);
        }

        @Test
        @DisplayName("Đổi token thất bại khi không tìm thấy trạm -> 404 Not Found")
        void rotateSecretToken_NotFound_ThrowsException() {
            when(kioskRepository.findById("KIOSK-UNKNOWN")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> kioskAdminService.rotateSecretToken("KIOSK-UNKNOWN"))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_NOT_FOUND);
                    });
        }
    }

    @Nested
    @DisplayName("3. Cập nhật và vô hiệu hóa trạm (updateKiosk)")
    class UpdateKioskTests {

        private Kiosk existingKiosk;

        @BeforeEach
        void initKiosk() {
            existingKiosk = Kiosk.builder()
                    .id("KIOSK-DN-01")
                    .locationName("Khu công nghệ cao")
                    .secretTokenHash("hash")
                    .isActive(true)
                    .createdAt(NOW)
                    .build();
        }

        @Test
        @DisplayName("Cập nhật vị trí và vô hiệu hóa trạm thành công")
        void updateKiosk_Deactivate_Success() {
            when(kioskRepository.findById("KIOSK-DN-01")).thenReturn(Optional.of(existingKiosk));
            when(kioskRepository.save(any(Kiosk.class))).thenAnswer(i -> i.getArgument(0));

            UpdateKioskRequest request = new UpdateKioskRequest("Khu văn phòng 2", false);

            KioskItemResponse response = kioskAdminService.updateKiosk("KIOSK-DN-01", request);

            assertThat(response.locationName()).isEqualTo("Khu văn phòng 2");
            assertThat(response.isActive()).isFalse();
            assertThat(existingKiosk.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("Cập nhật thất bại khi không tìm thấy trạm -> 404 Not Found")
        void updateKiosk_NotFound_ThrowsException() {
            when(kioskRepository.findById("UNKNOWN")).thenReturn(Optional.empty());

            UpdateKioskRequest request = new UpdateKioskRequest("Vị trí mới", true);

            assertThatThrownBy(() -> kioskAdminService.updateKiosk("UNKNOWN", request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> {
                        ApiException apiEx = (ApiException) ex;
                        assertThat(apiEx.getErrorCode()).isEqualTo(ApiErrorCode.KIOSK_NOT_FOUND);
                    });
        }
    }

    @Nested
    @DisplayName("4. Kiểm tra sức khỏe và kết nối (getKioskHealth)")
    class GetKioskHealthTests {

        @Test
        @DisplayName("Trạm trực tuyến bình thường khi ping cách 2 phút (<= 5 phút)")
        void getKioskHealth_Online_Healthy() {
            Kiosk onlineKiosk = Kiosk.builder()
                    .id("KIOSK-ONLINE")
                    .locationName("Sảnh A")
                    .isActive(true)
                    .lastPingAt(NOW.minus(Duration.ofMinutes(2)))
                    .build();

            when(kioskRepository.findById("KIOSK-ONLINE")).thenReturn(Optional.of(onlineKiosk));

            KioskHealthResponse health = kioskAdminService.getKioskHealth("KIOSK-ONLINE");

            assertThat(health.isHealthy()).isTrue();
            assertThat(health.warningMessage()).isNull();
            assertThat(health.isActive()).isTrue();
        }

        @Test
        @DisplayName("Cảnh báo khi trạm mất kết nối quá 5 phút (ping cách 10 phút)")
        void getKioskHealth_Offline_Warning() {
            Kiosk offlineKiosk = Kiosk.builder()
                    .id("KIOSK-OFFLINE")
                    .locationName("Kho B")
                    .isActive(true)
                    .lastPingAt(NOW.minus(Duration.ofMinutes(10)))
                    .build();

            when(kioskRepository.findById("KIOSK-OFFLINE")).thenReturn(Optional.of(offlineKiosk));

            KioskHealthResponse health = kioskAdminService.getKioskHealth("KIOSK-OFFLINE");

            assertThat(health.isHealthy()).isFalse();
            assertThat(health.warningMessage()).contains("mất kết nối quá 5 phút");
        }

        @Test
        @DisplayName("Cảnh báo khi trạm chưa từng gửi tín hiệu ping")
        void getKioskHealth_NeverPinged_Warning() {
            Kiosk neverPinged = Kiosk.builder()
                    .id("KIOSK-NEW")
                    .locationName("Phòng lab")
                    .isActive(true)
                    .lastPingAt(null)
                    .build();

            when(kioskRepository.findById("KIOSK-NEW")).thenReturn(Optional.of(neverPinged));

            KioskHealthResponse health = kioskAdminService.getKioskHealth("KIOSK-NEW");

            assertThat(health.isHealthy()).isFalse();
            assertThat(health.warningMessage()).contains("chưa từng gửi tín hiệu");
        }

        @Test
        @DisplayName("Cảnh báo khi trạm đang bị vô hiệu hóa")
        void getKioskHealth_Disabled_Warning() {
            Kiosk disabled = Kiosk.builder()
                    .id("KIOSK-DISABLED")
                    .locationName("Cổng phụ")
                    .isActive(false)
                    .lastPingAt(NOW)
                    .build();

            when(kioskRepository.findById("KIOSK-DISABLED")).thenReturn(Optional.of(disabled));

            KioskHealthResponse health = kioskAdminService.getKioskHealth("KIOSK-DISABLED");

            assertThat(health.isHealthy()).isFalse();
            assertThat(health.warningMessage()).contains("vô hiệu hóa");
        }
    }

    @Nested
    @DisplayName("5. Ghi nhận mốc ping (recordPing)")
    class RecordPingTests {

        @Test
        @DisplayName("Ghi nhận ping thành công cho trạm đang kích hoạt")
        void recordPing_ActiveKiosk_UpdatesLastPing() {
            Kiosk kiosk = Kiosk.builder()
                    .id("KIOSK-ACTIVE")
                    .isActive(true)
                    .lastPingAt(NOW.minusSeconds(600))
                    .build();

            when(kioskRepository.findById("KIOSK-ACTIVE")).thenReturn(Optional.of(kiosk));

            kioskAdminService.recordPing("KIOSK-ACTIVE");

            assertThat(kiosk.getLastPingAt()).isEqualTo(NOW);
            verify(kioskRepository).save(kiosk);
        }

        @Test
        @DisplayName("Không cập nhật ping cho trạm đang bị vô hiệu hóa")
        void recordPing_InactiveKiosk_DoesNotUpdate() {
            Kiosk kiosk = Kiosk.builder()
                    .id("KIOSK-INACTIVE")
                    .isActive(false)
                    .lastPingAt(NOW.minusSeconds(600))
                    .build();

            when(kioskRepository.findById("KIOSK-INACTIVE")).thenReturn(Optional.of(kiosk));

            kioskAdminService.recordPing("KIOSK-INACTIVE");

            assertThat(kiosk.getLastPingAt()).isEqualTo(NOW.minusSeconds(600));
            verify(kioskRepository, never()).save(any());
        }
    }
}
