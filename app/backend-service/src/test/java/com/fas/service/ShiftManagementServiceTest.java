package com.fas.service;

import com.fas.api.dto.request.AssignShiftRequest;
import com.fas.api.dto.request.BatchAssignShiftRequest;
import com.fas.api.dto.request.CreateShiftRequest;
import com.fas.api.dto.response.BatchAssignShiftResponse;
import com.fas.api.dto.request.UpdateShiftRequest;
import com.fas.api.dto.response.EmployeeShiftResponse;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.dto.response.ShiftResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.EmployeeShift;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.Role;
import com.fas.data.repository.EmployeeShiftRepository;
import com.fas.data.repository.ShiftRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Bộ kiểm thử đơn vị cho ShiftManagementService (SOL-BE-017, FR-BE-013, DATA-BE-017, DD-BE-017, BLD-BE-024, TASK-BE-029).
 */
@ExtendWith(MockitoExtension.class)
class ShiftManagementServiceTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private EmployeeShiftRepository employeeShiftRepository;

    @Mock
    private UserRepository userRepository;

    private ShiftManagementService shiftService;

    private Shift sampleShift;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        shiftService = new ShiftManagementService(shiftRepository, employeeShiftRepository, userRepository);

        sampleShift = Shift.builder()
                .id(1L)
                .shiftCode("CA-HANH-CHINH")
                .shiftName("Ca Hành chính Chuẩn")
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(17, 0))
                .gracePeriodMinutes(15)
                .isActive(true)
                .build();

        sampleUser = User.builder()
                .id(1042L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung.nv@company.com")
                .passwordHash("$2a$12$hash")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .department("Phòng Kỹ thuật")
                .build();
    }

    @Nested
    @DisplayName("1. Quản lý danh mục ca làm việc (CRUD Shift)")
    class ShiftCrudTests {

        @Test
        @DisplayName("Tạo ca làm việc thành công khi dữ liệu hợp lệ và mã ca duy nhất")
        void createShift_Success() {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-SANG", "Ca Sáng 08:00 - 12:00", LocalTime.of(8, 0), LocalTime.of(12, 0), 10);

            when(shiftRepository.existsByShiftCode("CA-SANG")).thenReturn(false);
            when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> {
                Shift s = invocation.getArgument(0);
                s.setId(10L);
                return s;
            });

            ShiftResponse response = shiftService.createShift(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(10L);
            assertThat(response.shiftCode()).isEqualTo("CA-SANG");
            assertThat(response.startTime()).isEqualTo(LocalTime.of(8, 0));
            assertThat(response.endTime()).isEqualTo(LocalTime.of(12, 0));
            assertThat(response.gracePeriodMinutes()).isEqualTo(10);
            assertThat(response.isActive()).isTrue();
        }

        @Test
        @DisplayName("Ném lỗi DATA_INTEGRITY_VIOLATION khi mã ca làm việc đã tồn tại")
        void createShift_DuplicateCode_ThrowsException() {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-HANH-CHINH", "Trùng mã", LocalTime.of(8, 0), LocalTime.of(17, 0), 15);

            when(shiftRepository.existsByShiftCode("CA-HANH-CHINH")).thenReturn(true);

            assertThatThrownBy(() -> shiftService.createShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.DATA_INTEGRITY_VIOLATION);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi giờ bắt đầu >= giờ kết thúc")
        void createShift_StartTimeAfterEndTime_ThrowsException() {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-LOI", "Giờ sai", LocalTime.of(17, 0), LocalTime.of(8, 0), 15);

            when(shiftRepository.existsByShiftCode("CA-LOI")).thenReturn(false);

            assertThatThrownBy(() -> shiftService.createShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi thời gian ân hạn ngoài khoảng 0-60")
        void createShift_InvalidGracePeriod_ThrowsException() {
            CreateShiftRequest request = new CreateShiftRequest(
                    "CA-LOI", "Grace sai", LocalTime.of(8, 0), LocalTime.of(17, 0), 65);

            when(shiftRepository.existsByShiftCode("CA-LOI")).thenReturn(false);

            assertThatThrownBy(() -> shiftService.createShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Cập nhật ca làm việc thành công")
        void updateShift_Success() {
            UpdateShiftRequest request = new UpdateShiftRequest(
                    "Ca Hành chính Đã Đổi", LocalTime.of(8, 30), LocalTime.of(17, 30), 20, true);

            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ShiftResponse response = shiftService.updateShift(1L, request);

            assertThat(response.shiftName()).isEqualTo("Ca Hành chính Đã Đổi");
            assertThat(response.startTime()).isEqualTo(LocalTime.of(8, 30));
            assertThat(response.endTime()).isEqualTo(LocalTime.of(17, 30));
            assertThat(response.gracePeriodMinutes()).isEqualTo(20);
        }

        @Test
        @DisplayName("Vô hiệu hóa ca thành công khi ca không được phân công cho nhân sự nào")
        void deactivateShift_Success_WhenNotInUse() {
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(employeeShiftRepository.findByShiftId(1L)).thenReturn(Collections.emptyList());
            when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ShiftResponse response = shiftService.deactivateShift(1L);

            assertThat(response.isActive()).isFalse();
            verify(shiftRepository).save(sampleShift);
        }

        @Test
        @DisplayName("Ném lỗi SHIFT_IN_USE (409) khi vô hiệu hóa ca đang được phân công cho nhân sự")
        void deactivateShift_ThrowsConflict_WhenInUse() {
            EmployeeShift activeAssignment = EmployeeShift.builder()
                    .id(100L)
                    .user(sampleUser)
                    .shift(sampleShift)
                    .effectiveFrom(LocalDate.now().minusDays(5))
                    .effectiveTo(null) // Đang phân công vô thời hạn
                    .build();

            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(employeeShiftRepository.findByShiftId(1L)).thenReturn(List.of(activeAssignment));

            assertThatThrownBy(() -> shiftService.deactivateShift(1L))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.SHIFT_IN_USE);

            verify(shiftRepository, never()).save(any(Shift.class));
        }

        @Test
        @DisplayName("Kích hoạt lại ca làm việc thành công")
        void activateShift_Success() {
            sampleShift.setIsActive(false);
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(shiftRepository.save(any(Shift.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ShiftResponse response = shiftService.activateShift(1L);

            assertThat(response.isActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("2. Phân ca nhân sự & Kiểm tra chồng lấn (assignShift)")
    class AssignShiftTests {

        @Test
        @DisplayName("Phân ca thành công khi nhân sự chưa có phân ca nào chồng lấn")
        void assignShift_Success() {
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(employeeShiftRepository.findByUserId(1042L)).thenReturn(Collections.emptyList());
            when(employeeShiftRepository.save(any(EmployeeShift.class))).thenAnswer(invocation -> {
                EmployeeShift es = invocation.getArgument(0);
                es.setId(500L);
                return es;
            });

            EmployeeShiftResponse response = shiftService.assignShift(request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(500L);
            assertThat(response.userId()).isEqualTo(1042L);
            assertThat(response.shiftCode()).isEqualTo("CA-HANH-CHINH");
            assertThat(response.effectiveFrom()).isEqualTo(LocalDate.of(2026, 10, 1));
            assertThat(response.effectiveTo()).isEqualTo(LocalDate.of(2026, 10, 31));
        }

        @Test
        @DisplayName("Ném lỗi ACCESS_DENIED khi phân ca cho nhân sự đã TERMINATED")
        void assignShift_TerminatedEmployee_ThrowsException() {
            sampleUser.setStatus(EmployeeStatus.TERMINATED);
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));

            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 10, 1), null);

            assertThatThrownBy(() -> shiftService.assignShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.ACCESS_DENIED);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi phân ca đã bị vô hiệu hóa")
        void assignShift_InactiveShift_ThrowsException() {
            sampleShift.setIsActive(false);
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));

            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 10, 1), null);

            assertThatThrownBy(() -> shiftService.assignShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED khi ngày bắt đầu > ngày kết thúc")
        void assignShift_InvalidDateRange_ThrowsException() {
            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));

            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 10, 31), LocalDate.of(2026, 10, 1));

            assertThatThrownBy(() -> shiftService.assignShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.VALIDATION_FAILED);
        }

        @Test
        @DisplayName("Ném lỗi SHIFT_OVERLAPPING (409) khi khoảng hiệu lực chồng lấn với ca có sẵn")
        void assignShift_OverlappingWithExistingRange_ThrowsConflict() {
            // Ca có sẵn: 2026-10-01 đến 2026-10-15
            EmployeeShift existing = EmployeeShift.builder()
                    .id(200L)
                    .user(sampleUser)
                    .shift(sampleShift)
                    .effectiveFrom(LocalDate.of(2026, 10, 1))
                    .effectiveTo(LocalDate.of(2026, 10, 15))
                    .build();

            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(employeeShiftRepository.findByUserId(1042L)).thenReturn(List.of(existing));

            // Yêu cầu phân ca mới: 2026-10-10 đến 2026-10-25 (chồng lấn từ 10-10 đến 10-15)
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 10, 10), LocalDate.of(2026, 10, 25));

            assertThatThrownBy(() -> shiftService.assignShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.SHIFT_OVERLAPPING);

            verify(employeeShiftRepository, never()).save(any(EmployeeShift.class));
        }

        @Test
        @DisplayName("Ném lỗi SHIFT_OVERLAPPING (409) khi chồng lấn với ca vô thời hạn (effectiveTo = null)")
        void assignShift_OverlappingWithInfiniteRange_ThrowsConflict() {
            // Ca có sẵn: 2026-10-01 đến vô thời hạn
            EmployeeShift existing = EmployeeShift.builder()
                    .id(200L)
                    .user(sampleUser)
                    .shift(sampleShift)
                    .effectiveFrom(LocalDate.of(2026, 10, 1))
                    .effectiveTo(null)
                    .build();

            when(userRepository.findById(1042L)).thenReturn(Optional.of(sampleUser));
            when(shiftRepository.findById(1L)).thenReturn(Optional.of(sampleShift));
            when(employeeShiftRepository.findByUserId(1042L)).thenReturn(List.of(existing));

            // Yêu cầu phân ca mới bắt đầu từ 2026-11-01
            AssignShiftRequest request = new AssignShiftRequest(
                    1042L, 1L, LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 30));

            assertThatThrownBy(() -> shiftService.assignShift(request))
                    .isInstanceOf(ApiException.class)
                    .extracting("errorCode")
                    .isEqualTo(ApiErrorCode.SHIFT_OVERLAPPING);
        }

        @Test
        @DisplayName("Gỡ phân ca thành công")
        void unassignShift_Success() {
            EmployeeShift es = EmployeeShift.builder().id(500L).user(sampleUser).shift(sampleShift).build();
            when(employeeShiftRepository.findById(500L)).thenReturn(Optional.of(es));

            shiftService.unassignShift(500L);

            verify(employeeShiftRepository).delete(es);
        }
    }

    @Nested
    @DisplayName("3. Đánh giá ca điểm danh & Ca hiệu lực (evaluatePunch)")
    class EvaluatePunchTests {

        @Test
        @DisplayName("Trả về ANOMALOUS khi nhân sự chưa được phân ca tại ngày điểm danh")
        void evaluatePunch_UnassignedEmployee_ReturnsAnomalous() {
            LocalDate today = LocalDate.of(2026, 10, 8);
            LocalTime punchTime = LocalTime.of(8, 5);

            when(employeeShiftRepository.findActiveShiftForUser(1042L, today)).thenReturn(Optional.empty());

            ShiftEvaluationResult result = shiftService.evaluatePunch(1042L, today, punchTime);

            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(AttendanceStatus.ANOMALOUS);
            assertThat(result.shiftId()).isNull();
            assertThat(result.shiftCode()).isNull();
            assertThat(result.lateMinutes()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Trả về ON_TIME khi điểm danh trước hoặc đúng giờ bắt đầu ca")
        void evaluatePunch_OnTime_BeforeStart() {
            LocalDate today = LocalDate.of(2026, 10, 8);
            LocalTime punchTime = LocalTime.of(7, 55); // Giờ ca: 08:00

            EmployeeShift activeAssignment = EmployeeShift.builder().shift(sampleShift).build();
            when(employeeShiftRepository.findActiveShiftForUser(1042L, today))
                    .thenReturn(Optional.of(activeAssignment));

            ShiftEvaluationResult result = shiftService.evaluatePunch(1042L, today, punchTime);

            assertThat(result.status()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(result.lateMinutes()).isEqualTo(0L);
            assertThat(result.shiftCode()).isEqualTo("CA-HANH-CHINH");
        }

        @Test
        @DisplayName("Trả về ON_TIME khi điểm danh trong thời gian ân hạn (Grace Period)")
        void evaluatePunch_OnTime_WithinGracePeriod() {
            LocalDate today = LocalDate.of(2026, 10, 8);
            LocalTime punchTime = LocalTime.of(8, 14); // Ca 08:00, ân hạn 15p (đến 08:15)

            EmployeeShift activeAssignment = EmployeeShift.builder().shift(sampleShift).build();
            when(employeeShiftRepository.findActiveShiftForUser(1042L, today))
                    .thenReturn(Optional.of(activeAssignment));

            ShiftEvaluationResult result = shiftService.evaluatePunch(1042L, today, punchTime);

            assertThat(result.status()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(result.lateMinutes()).isEqualTo(0L);
        }

        @Test
        @DisplayName("Trả về LATE và tính đúng late_minutes khi điểm danh vượt thời gian ân hạn")
        void evaluatePunch_Late_ExceedsGracePeriod() {
            LocalDate today = LocalDate.of(2026, 10, 8);
            LocalTime punchTime = LocalTime.of(8, 45); // Ca 08:00, muộn 45 phút

            EmployeeShift activeAssignment = EmployeeShift.builder().shift(sampleShift).build();
            when(employeeShiftRepository.findActiveShiftForUser(1042L, today))
                    .thenReturn(Optional.of(activeAssignment));

            ShiftEvaluationResult result = shiftService.evaluatePunch(1042L, today, punchTime);

            assertThat(result.status()).isEqualTo(AttendanceStatus.LATE);
            assertThat(result.lateMinutes()).isEqualTo(45L);
            assertThat(result.shiftCode()).isEqualTo("CA-HANH-CHINH");
            assertThat(result.shiftStartTime()).isEqualTo(LocalTime.of(8, 0));
        }
    }

    @Nested
    @DisplayName("4. Toán tử kiểm tra giao khoảng thời gian (isOverlapping)")
    class IntervalOverlapMathTests {

        @Test
        void intervalMath_FiniteRanges() {
            LocalDate oct1 = LocalDate.of(2026, 10, 1);
            LocalDate oct10 = LocalDate.of(2026, 10, 10);
            LocalDate oct5 = LocalDate.of(2026, 10, 5);
            LocalDate oct15 = LocalDate.of(2026, 10, 15);
            LocalDate oct11 = LocalDate.of(2026, 10, 11);

            // [1, 10] và [5, 15] -> giao
            assertThat(shiftService.isOverlapping(oct1, oct10, oct5, oct15)).isTrue();

            // [1, 10] và [11, 15] -> không giao
            assertThat(shiftService.isOverlapping(oct1, oct10, oct11, oct15)).isFalse();

            // [5, 15] và [1, 10] -> đối xứng
            assertThat(shiftService.isOverlapping(oct5, oct15, oct1, oct10)).isTrue();
        }

        @Test
        void intervalMath_WithInfiniteRanges() {
            LocalDate oct1 = LocalDate.of(2026, 10, 1);
            LocalDate oct10 = LocalDate.of(2026, 10, 10);
            LocalDate sep1 = LocalDate.of(2026, 9, 1);
            LocalDate sep20 = LocalDate.of(2026, 9, 20);

            // [1, null] và [10, 15] -> giao
            assertThat(shiftService.isOverlapping(oct1, null, oct10, LocalDate.of(2026, 10, 15))).isTrue();

            // [1, null] và [sep1, sep20] -> không giao
            assertThat(shiftService.isOverlapping(oct1, null, sep1, sep20)).isFalse();

            // [1, null] và [oct10, null] -> giao
            assertThat(shiftService.isOverlapping(oct1, null, oct10, null)).isTrue();
        }
    }

    @Nested
    @DisplayName("5. Phân công ca làm việc hàng loạt (assignShiftBatch)")
    class BatchAssignShiftServiceTests {

        @Test
        @DisplayName("Phân ca hàng loạt xử lý từng nhân viên và tổng hợp danh sách thành công / thất bại")
        void assignShiftBatch_PartialSuccessAndFailures() {
            Shift shift = Shift.builder()
                    .id(1L)
                    .shiftCode("CA-SANG")
                    .shiftName("Ca Sáng")
                    .startTime(LocalTime.of(8, 0))
                    .endTime(LocalTime.of(17, 30))
                    .gracePeriodMinutes(15)
                    .isActive(true)
                    .build();

            User user1 = User.builder()
                    .id(101L)
                    .employeeCode("NV-101")
                    .fullName("Nguyễn Văn Nam")
                    .status(EmployeeStatus.ACTIVE)
                    .build();

            User user2 = User.builder()
                    .id(102L)
                    .employeeCode("NV-102")
                    .fullName("Trần Văn Bình")
                    .status(EmployeeStatus.ACTIVE)
                    .build();

            when(shiftRepository.findById(1L)).thenReturn(Optional.of(shift));
            when(userRepository.findById(101L)).thenReturn(Optional.of(user1));
            when(userRepository.findById(102L)).thenReturn(Optional.of(user2));

            // User 1 không có phân ca nào trước đó
            when(employeeShiftRepository.findByUserId(101L)).thenReturn(Collections.emptyList());

            // User 2 đã có phân ca trùng lặp
            EmployeeShift existingShift = EmployeeShift.builder()
                    .id(99L)
                    .user(user2)
                    .shift(shift)
                    .effectiveFrom(LocalDate.of(2026, 11, 1))
                    .effectiveTo(LocalDate.of(2026, 11, 30))
                    .build();
            when(employeeShiftRepository.findByUserId(102L)).thenReturn(List.of(existingShift));

            when(employeeShiftRepository.save(any(EmployeeShift.class))).thenAnswer(invocation -> {
                EmployeeShift saved = invocation.getArgument(0);
                return EmployeeShift.builder()
                        .id(501L)
                        .user(saved.getUser())
                        .shift(saved.getShift())
                        .effectiveFrom(saved.getEffectiveFrom())
                        .effectiveTo(saved.getEffectiveTo())
                        .build();
            });

            BatchAssignShiftRequest request = new BatchAssignShiftRequest(
                    List.of(101L, 102L),
                    1L,
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 15)
            );

            BatchAssignShiftResponse response = shiftService.assignShiftBatch(request);

            assertThat(response.total()).isEqualTo(2);
            assertThat(response.successCount()).isEqualTo(1);
            assertThat(response.failedCount()).isEqualTo(1);
            assertThat(response.successfulAssignments()).hasSize(1);
            assertThat(response.successfulAssignments().get(0).employeeCode()).isEqualTo("NV-101");
            assertThat(response.failures()).hasSize(1);
            assertThat(response.failures().get(0).employeeCode()).isEqualTo("NV-102");
            assertThat(response.failures().get(0).reason()).contains("Chồng lấn với ca");
        }

        @Test
        @DisplayName("Phân ca hàng loạt thất bại nếu ca làm việc bị vô hiệu hóa")
        void assignShiftBatch_ShiftInactive_ThrowsValidationFailed() {
            Shift inactiveShift = Shift.builder()
                    .id(1L)
                    .shiftCode("CA-CU")
                    .shiftName("Ca Cũ")
                    .isActive(false)
                    .build();

            when(shiftRepository.findById(1L)).thenReturn(Optional.of(inactiveShift));

            BatchAssignShiftRequest request = new BatchAssignShiftRequest(
                    List.of(101L),
                    1L,
                    LocalDate.of(2026, 11, 1),
                    LocalDate.of(2026, 11, 30)
            );

            assertThatThrownBy(() -> shiftService.assignShiftBatch(request))
                    .isInstanceOf(ApiException.class)
                    .hasMessageContaining("Không thể phân ca đã bị vô hiệu hóa");
        }
    }
}
