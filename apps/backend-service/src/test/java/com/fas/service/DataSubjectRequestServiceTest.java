package com.fas.service;

import com.fas.api.dto.request.CreateDataSubjectRequest;
import com.fas.api.dto.request.UpdateDataSubjectRequest;
import com.fas.api.dto.response.DataSubjectRequestResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.DataSubjectRequest;
import com.fas.data.entity.User;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.NotificationEventType;
import com.fas.data.enums.Role;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.DataSubjectRequestRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho DataSubjectRequestService (SOL-BE-025, FR-BE-022, BLD-BE-032, TASK-BE-037).
 */
@ExtendWith(MockitoExtension.class)
class DataSubjectRequestServiceTest {

    @Mock
    private DataSubjectRequestRepository dataSubjectRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private AuditLogRepository auditLogRepository;

    private final Instant fixedInstant = Instant.parse("2026-10-10T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(fixedInstant, ZoneId.of("UTC"));

    private DataSubjectRequestService requestService;
    private User employee;
    private User dpoUser;

    @BeforeEach
    void setUp() {
        requestService = new DataSubjectRequestService(
                dataSubjectRequestRepository,
                userRepository,
                notificationService,
                auditLogRepository,
                fixedClock
        );

        employee = User.builder()
                .id(100L)
                .employeeCode("EMP001")
                .fullName("Nguyen Van A")
                .email("nva@fas.com")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.ACTIVE)
                .build();

        dpoUser = User.builder()
                .id(20L)
                .employeeCode("DPO001")
                .fullName("Can Bo DPO")
                .email("dpo@fas.com")
                .role(Role.ADMIN)
                .status(EmployeeStatus.ACTIVE)
                .build();
    }

    @Nested
    @DisplayName("Tạo yêu cầu dữ liệu cá nhân (createRequest)")
    class CreateRequestTests {

        @Test
        @DisplayName("Tạo yêu cầu thành công với trạng thái ban đầu RECEIVED")
        void createRequest_success() {
            CreateDataSubjectRequest request = new CreateDataSubjectRequest(
                    DataSubjectRequestType.ACCESS,
                    "Xin trích xuất toàn bộ dữ liệu chấm công quý 3/2026"
            );

            when(userRepository.findById(100L)).thenReturn(Optional.of(employee));
            when(dataSubjectRequestRepository.save(any(DataSubjectRequest.class))).thenAnswer(inv -> {
                DataSubjectRequest entity = inv.getArgument(0);
                entity.setId(10L);
                return entity;
            });

            DataSubjectRequestResponse response = requestService.createRequest(100L, request);

            assertThat(response).isNotNull();
            assertThat(response.id()).isEqualTo(10L);
            assertThat(response.userId()).isEqualTo(100L);
            assertThat(response.requestType()).isEqualTo(DataSubjectRequestType.ACCESS);
            assertThat(response.status()).isEqualTo(DataSubjectRequestStatus.RECEIVED);
            assertThat(response.detail()).isEqualTo("Xin trích xuất toàn bộ dữ liệu chấm công quý 3/2026");
            assertThat(response.createdAt()).isEqualTo(fixedInstant);

            verify(dataSubjectRequestRepository).save(any(DataSubjectRequest.class));
        }

        @Test
        @DisplayName("Ném lỗi VALIDATION_FAILED nếu request hoặc requestType bị null")
        void createRequest_nullType_throwsException() {
            assertThatThrownBy(() -> requestService.createRequest(100L, null))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));

            CreateDataSubjectRequest invalidReq = new CreateDataSubjectRequest(null, "Chi tiết");
            assertThatThrownBy(() -> requestService.createRequest(100L, invalidReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.VALIDATION_FAILED));
        }
    }

    @Nested
    @DisplayName("Cập nhật trạng thái xử lý bởi DPO (updateRequestStatus)")
    class UpdateRequestStatusTests {

        @Test
        @DisplayName("Cập nhật trạng thái thành FULFILLED, sinh thông báo cho nhân viên & ghi audit")
        void updateRequestStatus_success() {
            DataSubjectRequest existing = DataSubjectRequest.builder()
                    .id(10L)
                    .user(employee)
                    .requestType(DataSubjectRequestType.ACCESS)
                    .status(DataSubjectRequestStatus.IN_PROGRESS)
                    .createdAt(fixedInstant)
                    .build();

            UpdateDataSubjectRequest updateReq = new UpdateDataSubjectRequest(
                    DataSubjectRequestStatus.FULFILLED,
                    "Đã trích xuất và gửi dữ liệu vào hòm thư cá nhân"
            );

            when(userRepository.findById(20L)).thenReturn(Optional.of(dpoUser));
            when(dataSubjectRequestRepository.findById(10L)).thenReturn(Optional.of(existing));
            when(dataSubjectRequestRepository.save(any(DataSubjectRequest.class))).thenAnswer(inv -> inv.getArgument(0));

            DataSubjectRequestResponse response = requestService.updateRequestStatus(10L, 20L, updateReq);

            assertThat(response.status()).isEqualTo(DataSubjectRequestStatus.FULFILLED);
            assertThat(response.handledById()).isEqualTo(20L);
            assertThat(response.response()).isEqualTo("Đã trích xuất và gửi dữ liệu vào hòm thư cá nhân");
            assertThat(response.respondedAt()).isEqualTo(fixedInstant);

            // 1. Kiểm tra sinh thông báo cho người nộp đơn (ID=100L)
            verify(notificationService).createNotification(
                    eq(100L),
                    eq(NotificationEventType.DATA_REQUEST_UPDATED),
                    anyString(),
                    anyString(),
                    eq("DATA_SUBJECT_REQUEST"),
                    eq("10")
            );

            // 2. Kiểm tra ghi Audit Log
            verify(auditLogRepository).save(argThat(log ->
                    "UPDATE_DATA_SUBJECT_REQUEST".equals(log.getAction()) &&
                    "DATA_SUBJECT_REQUEST".equals(log.getEntityType()) &&
                    dpoUser.equals(log.getActor())
            ));
        }

        @Test
        @DisplayName("Ném lỗi khi DPO hoặc yêu cầu không tồn tại")
        void updateRequestStatus_notFound_throwsException() {
            UpdateDataSubjectRequest updateReq = new UpdateDataSubjectRequest(DataSubjectRequestStatus.FULFILLED, "Xong");

            when(userRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> requestService.updateRequestStatus(10L, 999L, updateReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.EMPLOYEE_NOT_FOUND));

            when(userRepository.findById(20L)).thenReturn(Optional.of(dpoUser));
            when(dataSubjectRequestRepository.findById(999L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> requestService.updateRequestStatus(999L, 20L, updateReq))
                    .isInstanceOf(ApiException.class)
                    .satisfies(e -> assertThat(((ApiException) e).getErrorCode()).isEqualTo(ApiErrorCode.RESOURCE_NOT_FOUND));
        }
    }

    @Nested
    @DisplayName("Tra cứu danh sách yêu cầu")
    class QueryRequestsTests {

        @Test
        @DisplayName("Tra cứu yêu cầu của nhân viên thành công")
        void getRequestsByUser_success() {
            when(userRepository.existsById(100L)).thenReturn(true);

            DataSubjectRequest req = DataSubjectRequest.builder()
                    .id(1L)
                    .user(employee)
                    .requestType(DataSubjectRequestType.CORRECTION)
                    .status(DataSubjectRequestStatus.RECEIVED)
                    .build();

            Pageable pageable = PageRequest.of(0, 10);
            when(dataSubjectRequestRepository.findByUserId(100L, pageable))
                    .thenReturn(new PageImpl<>(List.of(req), pageable, 1));

            Page<DataSubjectRequestResponse> result = requestService.getRequestsByUser(100L, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getContent().get(0).requestType()).isEqualTo(DataSubjectRequestType.CORRECTION);
        }
    }
}
