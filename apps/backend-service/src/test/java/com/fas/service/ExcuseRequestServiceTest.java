package com.fas.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fas.api.dto.request.ApproveExcuseRequest;
import com.fas.api.dto.request.RejectExcuseRequest;
import com.fas.api.dto.request.SubmitExcuseRequest;
import com.fas.api.dto.response.ExcuseRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.AuditLog;
import com.fas.data.entity.ExcuseRequest;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.ExcuseRequestRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị toàn diện cho {@link ExcuseRequestService} (TASK-BE-030, BLD-BE-025, TST-BE-026).
 */
@ExtendWith(MockitoExtension.class)
class ExcuseRequestServiceTest {

    @Mock
    private ExcuseRequestRepository excuseRequestRepository;

    @Mock
    private AttendanceLogRepository attendanceLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final Instant fixedNow = Instant.parse("2026-10-10T10:00:00Z");
    private final Clock clock = Clock.fixed(fixedNow, ZoneId.of("UTC"));

    private ExcuseRequestService service;

    private User employee;
    private User otherEmployee;
    private User hrManager;
    private AttendanceLog sampleLog;

    @BeforeEach
    void setUp() {
        service = new ExcuseRequestService(
                excuseRequestRepository,
                attendanceLogRepository,
                userRepository,
                auditLogRepository,
                objectMapper,
                clock
        );

        employee = User.builder()
                .id(101L)
                .employeeCode("NV-1042")
                .fullName("Ngô Văn Dũng")
                .email("dung@company.com")
                .role(Role.EMPLOYEE)
                .build();

        otherEmployee = User.builder()
                .id(102L)
                .employeeCode("NV-1043")
                .fullName("Trần Thị Mai")
                .email("mai@company.com")
                .role(Role.EMPLOYEE)
                .build();

        hrManager = User.builder()
                .id(201L)
                .employeeCode("HR-001")
                .fullName("Lê Quản Trị")
                .email("hr@company.com")
                .role(Role.HR_MANAGER)
                .build();

        sampleLog = AttendanceLog.builder()
                .id(501L)
                .user(employee)
                .punchTimestamp(fixedNow.minus(Duration.ofDays(2))) // 2 ngày trước
                .punchType(PunchType.CHECK_IN)
                .verificationMethod(VerificationMethod.VERIFICATION_FACE)
                .status(AttendanceStatus.LATE)
                .lateMinutes(15)
                .build();
    }

    @Nested
    @DisplayName("1. Nộp đơn giải trình công (submitExcuseRequest)")
    class SubmitExcuseRequestTests {

        @Test
        @DisplayName("Nộp đơn thành công cho bản ghi của chính mình trong 30 ngày -> Tạo đơn PENDING")
        void submitExcuseRequest_Success() {
            Instant requestedTime = fixedNow.minus(Duration.ofDays(2)).minus(Duration.ofMinutes(15));
            SubmitExcuseRequest request = new SubmitExcuseRequest(
                    sampleLog.getId(),
                    "Máy quét nhận diện trễ do ngược sáng",
                    requestedTime
            );

            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(sampleLog.getId())).thenReturn(Optional.of(sampleLog));
            when(excuseRequestRepository.existsByAttendanceLogIdAndStatus(sampleLog.getId(), ExcuseRequestStatus.PENDING))
                    .thenReturn(false);

            when(excuseRequestRepository.save(any(ExcuseRequest.class))).thenAnswer(invocation -> {
                ExcuseRequest req = invocation.getArgument(0);
                req.setId(888L);
                return req;
            });

            ExcuseRequestResponse response = service.submitExcuseRequest(employee.getId(), request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(888L);
            assertThat(response.userId()).isEqualTo(employee.getId());
            assertThat(response.attendanceLogId()).isEqualTo(sampleLog.getId());
            assertThat(response.status()).isEqualTo(ExcuseRequestStatus.PENDING);
            assertThat(response.reason()).isEqualTo("Máy quét nhận diện trễ do ngược sáng");
            assertThat(response.requestedPunchTimestamp()).isEqualTo(requestedTime);

            verify(excuseRequestRepository).save(any(ExcuseRequest.class));
        }

        @Test
        @DisplayName("Từ chối khi không tìm thấy nhân viên -> 404 EMPLOYEE_NOT_FOUND")
        void submitExcuseRequest_EmployeeNotFound() {
            SubmitExcuseRequest request = new SubmitExcuseRequest(sampleLog.getId(), "Lý do", null);
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.submitExcuseRequest(999L, request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }

        @Test
        @DisplayName("Từ chối khi không tìm thấy bản ghi điểm danh -> 404 RESOURCE_NOT_FOUND")
        void submitExcuseRequest_AttendanceLogNotFound() {
            SubmitExcuseRequest request = new SubmitExcuseRequest(999L, "Lý do", null);
            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.submitExcuseRequest(employee.getId(), request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));
        }

        @Test
        @DisplayName("Từ chối khi nộp đơn cho bản ghi của người khác -> 404 RESOURCE_NOT_FOUND")
        void submitExcuseRequest_NotOwnedLog_Throws404() {
            sampleLog.setUser(otherEmployee); // Gán bản ghi cho nhân viên khác
            SubmitExcuseRequest request = new SubmitExcuseRequest(sampleLog.getId(), "Lý do", null);

            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(sampleLog.getId())).thenReturn(Optional.of(sampleLog));

            assertThatThrownBy(() -> service.submitExcuseRequest(employee.getId(), request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));

            verify(excuseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối khi bản ghi điểm danh quá 30 ngày -> 400 EXCUSE_WINDOW_EXPIRED")
        void submitExcuseRequest_OlderThan30Days_Throws400() {
            sampleLog.setPunchTimestamp(fixedNow.minus(Duration.ofDays(31))); // 31 ngày trước
            SubmitExcuseRequest request = new SubmitExcuseRequest(sampleLog.getId(), "Lý do", null);

            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(sampleLog.getId())).thenReturn(Optional.of(sampleLog));

            assertThatThrownBy(() -> service.submitExcuseRequest(employee.getId(), request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_WINDOW_EXPIRED));

            verify(excuseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Chấp nhận khi bản ghi điểm danh nằm chính xác trong 30 ngày (boundary)")
        void submitExcuseRequest_ExactlyWithin30Days_Success() {
            sampleLog.setPunchTimestamp(fixedNow.minus(Duration.ofDays(29)).minus(Duration.ofHours(23)));
            SubmitExcuseRequest request = new SubmitExcuseRequest(sampleLog.getId(), "Lý do", null);

            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(sampleLog.getId())).thenReturn(Optional.of(sampleLog));
            when(excuseRequestRepository.existsByAttendanceLogIdAndStatus(sampleLog.getId(), ExcuseRequestStatus.PENDING))
                    .thenReturn(false);
            when(excuseRequestRepository.save(any(ExcuseRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ExcuseRequestResponse res = service.submitExcuseRequest(employee.getId(), request);
            assertThat(res.status()).isEqualTo(ExcuseRequestStatus.PENDING);
        }

        @Test
        @DisplayName("Từ chối khi đã có đơn PENDING cho lượt điểm danh đó -> 409 EXCUSE_ALREADY_PENDING")
        void submitExcuseRequest_AlreadyPending_Throws409() {
            SubmitExcuseRequest request = new SubmitExcuseRequest(sampleLog.getId(), "Lý do", null);

            when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
            when(attendanceLogRepository.findById(sampleLog.getId())).thenReturn(Optional.of(sampleLog));
            when(excuseRequestRepository.existsByAttendanceLogIdAndStatus(sampleLog.getId(), ExcuseRequestStatus.PENDING))
                    .thenReturn(true);

            assertThatThrownBy(() -> service.submitExcuseRequest(employee.getId(), request))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_ALREADY_PENDING));

            verify(excuseRequestRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("2. Tra cứu danh sách đơn giải trình")
    class QueryExcuseRequestTests {

        @Test
        @DisplayName("Nhân viên tra cứu đơn của chính mình -> Phân trang thành công")
        void getEmployeeExcuseRequests_Success() {
            Pageable pageable = PageRequest.of(0, 10);
            ExcuseRequest r1 = ExcuseRequest.builder().id(1L).user(employee).reason("Lý do 1").build();
            ExcuseRequest r2 = ExcuseRequest.builder().id(2L).user(employee).reason("Lý do 2").build();

            when(userRepository.existsById(employee.getId())).thenReturn(true);
            when(excuseRequestRepository.findByUserId(employee.getId(), pageable))
                    .thenReturn(new PageImpl<>(List.of(r1, r2), pageable, 2));

            Page<ExcuseRequestResponse> page = service.getEmployeeExcuseRequests(employee.getId(), pageable);

            assertThat(page.getTotalElements()).isEqualTo(2);
            assertThat(page.getContent()).extracting(res -> res.id()).containsExactly(1L, 2L);
        }

        @Test
        @DisplayName("Nhân viên tra cứu nhưng user không tồn tại -> 404 EMPLOYEE_NOT_FOUND")
        void getEmployeeExcuseRequests_UserNotFound() {
            when(userRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> service.getEmployeeExcuseRequests(999L, PageRequest.of(0, 10)))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }

        @Test
        @DisplayName("HR tra cứu lọc theo trạng thái PENDING -> Gọi findByStatus")
        void getExcuseRequests_ByStatus() {
            Pageable pageable = PageRequest.of(0, 10);
            ExcuseRequest r = ExcuseRequest.builder().id(1L).user(employee).status(ExcuseRequestStatus.PENDING).build();

            when(excuseRequestRepository.findByStatus(ExcuseRequestStatus.PENDING, pageable))
                    .thenReturn(new PageImpl<>(List.of(r), pageable, 1));

            Page<ExcuseRequestResponse> page = service.getExcuseRequests(ExcuseRequestStatus.PENDING, pageable);

            assertThat(page.getTotalElements()).isEqualTo(1);
            verify(excuseRequestRepository).findByStatus(ExcuseRequestStatus.PENDING, pageable);
            verify(excuseRequestRepository, never()).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("HR tra cứu không truyền status -> Gọi findAll")
        void getExcuseRequests_All() {
            Pageable pageable = PageRequest.of(0, 10);
            when(excuseRequestRepository.findAll(pageable))
                    .thenReturn(new PageImpl<>(List.of(), pageable, 0));

            Page<ExcuseRequestResponse> page = service.getExcuseRequests(null, pageable);

            assertThat(page.getTotalElements()).isEqualTo(0);
            verify(excuseRequestRepository).findAll(pageable);
        }

        @Test
        @DisplayName("Tra cứu chi tiết đơn theo ID thành công")
        void getExcuseRequestById_Success() {
            ExcuseRequest r = ExcuseRequest.builder().id(10L).user(employee).reason("Lý do").build();
            when(excuseRequestRepository.findById(10L)).thenReturn(Optional.of(r));

            ExcuseRequestResponse res = service.getExcuseRequestById(10L);
            assertThat(res.id()).isEqualTo(10L);
            assertThat(res.reason()).isEqualTo("Lý do");
        }

        @Test
        @DisplayName("Tra cứu chi tiết đơn theo ID không tồn tại -> 404 RESOURCE_NOT_FOUND")
        void getExcuseRequestById_NotFound() {
            when(excuseRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.getExcuseRequestById(999L))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("3. Phê duyệt đơn giải trình công (approveExcuseRequest)")
    class ApproveExcuseRequestTests {

        @Test
        @DisplayName("Duyệt đơn thành công -> Đổi status APPROVED, sửa AttendanceLog thành ON_TIME, sinh 1 bản ghi AuditLog")
        void approveExcuseRequest_Success() {
            Instant requestedTime = fixedNow.minus(Duration.ofDays(2)).minus(Duration.ofMinutes(15));
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(301L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .requestedPunchTimestamp(requestedTime)
                    .status(ExcuseRequestStatus.PENDING)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));
            when(excuseRequestRepository.save(any(ExcuseRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ApproveExcuseRequest approveReq = new ApproveExcuseRequest("Đã xác minh camera");
            ExcuseRequestResponse response = service.approveExcuseRequest(excuse.getId(), hrManager.getId(), approveReq);

            // 1. Kiểm tra đơn giải trình
            assertThat(response.status()).isEqualTo(ExcuseRequestStatus.APPROVED);
            assertThat(response.decidedById()).isEqualTo(hrManager.getId());
            assertThat(response.decidedByName()).isEqualTo(hrManager.getFullName());
            assertThat(response.decidedAt()).isEqualTo(fixedNow);

            // 2. Kiểm tra AttendanceLog được cập nhật
            assertThat(sampleLog.getStatus()).isEqualTo(AttendanceStatus.ON_TIME);
            assertThat(sampleLog.getLateMinutes()).isEqualTo(0);
            assertThat(sampleLog.getPunchTimestamp()).isEqualTo(requestedTime);
            verify(attendanceLogRepository).save(sampleLog);

            // 3. Kiểm tra AuditLog được tạo với đầy đủ before/after state
            ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
            verify(auditLogRepository).save(auditCaptor.capture());

            AuditLog auditLog = auditCaptor.getValue();
            assertThat(auditLog.getActor()).isEqualTo(hrManager);
            assertThat(auditLog.getAction()).isEqualTo("APPROVE_EXCUSE_REQUEST");
            assertThat(auditLog.getEntityType()).isEqualTo("ATTENDANCE_LOG");
            assertThat(auditLog.getEntityId()).isEqualTo(sampleLog.getId().toString());
            assertThat(auditLog.getBeforeState()).contains("\"status\":\"LATE\"");
            assertThat(auditLog.getBeforeState()).contains("\"lateMinutes\":15");
            assertThat(auditLog.getAfterState()).contains("\"status\":\"ON_TIME\"");
            assertThat(auditLog.getAfterState()).contains("\"lateMinutes\":0");
        }

        @Test
        @DisplayName("Từ chối duyệt khi đơn đã APPROVED -> 409 EXCUSE_ALREADY_PROCESSED")
        void approveExcuseRequest_AlreadyApproved_Throws409() {
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(301L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .status(ExcuseRequestStatus.APPROVED)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));

            assertThatThrownBy(() -> service.approveExcuseRequest(excuse.getId(), hrManager.getId(), null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_ALREADY_PROCESSED));

            verify(attendanceLogRepository, never()).save(any());
            verify(auditLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối duyệt khi đơn đã REJECTED -> 409 EXCUSE_ALREADY_PROCESSED")
        void approveExcuseRequest_AlreadyRejected_Throws409() {
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(301L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .status(ExcuseRequestStatus.REJECTED)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));

            assertThatThrownBy(() -> service.approveExcuseRequest(excuse.getId(), hrManager.getId(), null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_ALREADY_PROCESSED));
        }

        @Test
        @DisplayName("Từ chối duyệt khi không tìm thấy HR User -> 404 EMPLOYEE_NOT_FOUND")
        void approveExcuseRequest_HrNotFound_Throws404() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.approveExcuseRequest(301L, 999L, null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));
        }

        @Test
        @DisplayName("Từ chối duyệt khi không tìm thấy đơn -> 404 RESOURCE_NOT_FOUND")
        void approveExcuseRequest_RequestNotFound_Throws404() {
            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.approveExcuseRequest(999L, hrManager.getId(), null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("4. Từ chối đơn giải trình công (rejectExcuseRequest)")
    class RejectExcuseRequestTests {

        @Test
        @DisplayName("Từ chối đơn thành công -> Đổi status REJECTED, lưu lý do từ chối, không sửa AttendanceLog")
        void rejectExcuseRequest_Success() {
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(401L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .status(ExcuseRequestStatus.PENDING)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));
            when(excuseRequestRepository.save(any(ExcuseRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

            RejectExcuseRequest rejectReq = new RejectExcuseRequest("Hình ảnh camera cho thấy đến trễ thực sự");
            ExcuseRequestResponse response = service.rejectExcuseRequest(excuse.getId(), hrManager.getId(), rejectReq);

            assertThat(response.status()).isEqualTo(ExcuseRequestStatus.REJECTED);
            assertThat(response.decidedById()).isEqualTo(hrManager.getId());
            assertThat(response.rejectionReason()).isEqualTo("Hình ảnh camera cho thấy đến trễ thực sự");
            assertThat(response.decidedAt()).isEqualTo(fixedNow);

            // Không thay đổi AttendanceLog và không ghi AuditLog sửa AttendanceLog
            verify(attendanceLogRepository, never()).save(any());
            verify(auditLogRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối đơn thất bại khi thiếu lý do từ chối -> 400 VALIDATION_FAILED")
        void rejectExcuseRequest_BlankReason_Throws400() {
            RejectExcuseRequest rejectReq = new RejectExcuseRequest("   ");

            assertThatThrownBy(() -> service.rejectExcuseRequest(401L, hrManager.getId(), rejectReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            verify(excuseRequestRepository, never()).save(any());
        }

        @Test
        @DisplayName("Từ chối đơn khi request null -> 400 VALIDATION_FAILED")
        void rejectExcuseRequest_NullRequest_Throws400() {
            assertThatThrownBy(() -> service.rejectExcuseRequest(401L, hrManager.getId(), null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("Từ chối đơn khi đơn đã APPROVED -> 409 EXCUSE_ALREADY_PROCESSED")
        void rejectExcuseRequest_AlreadyApproved_Throws409() {
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(401L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .status(ExcuseRequestStatus.APPROVED)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));

            RejectExcuseRequest rejectReq = new RejectExcuseRequest("Lý do từ chối");
            assertThatThrownBy(() -> service.rejectExcuseRequest(excuse.getId(), hrManager.getId(), rejectReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_ALREADY_PROCESSED));
        }

        @Test
        @DisplayName("Từ chối đơn khi đơn đã REJECTED -> 409 EXCUSE_ALREADY_PROCESSED")
        void rejectExcuseRequest_AlreadyRejected_Throws409() {
            ExcuseRequest excuse = ExcuseRequest.builder()
                    .id(401L)
                    .user(employee)
                    .attendanceLog(sampleLog)
                    .status(ExcuseRequestStatus.REJECTED)
                    .build();

            when(userRepository.findById(hrManager.getId())).thenReturn(Optional.of(hrManager));
            when(excuseRequestRepository.findById(excuse.getId())).thenReturn(Optional.of(excuse));

            RejectExcuseRequest rejectReq = new RejectExcuseRequest("Lý do từ chối");
            assertThatThrownBy(() -> service.rejectExcuseRequest(excuse.getId(), hrManager.getId(), rejectReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(ex -> assertThat(((ApiException) ex).getErrorCode()).isEqualTo(ApiErrorCode.EXCUSE_ALREADY_PROCESSED));
        }
    }
}
