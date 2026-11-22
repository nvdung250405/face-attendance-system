package com.fas.service.audit;

import com.fas.data.entity.AuditLog;
import com.fas.data.entity.User;
import com.fas.data.repository.AuditLogRepository;
import com.fas.data.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho {@link AuditAspect} và {@link AuditService}
 * (TASK-BE-017, BLD-BE-015, TST-BE-015, SOL-BE-007, DD-BE-002, ARC-006).
 */
@ExtendWith(MockitoExtension.class)
class AuditAspectTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    private ObjectMapper objectMapper;
    private AuditService auditService;
    private AuditAspect auditAspect;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        auditService = new AuditService(auditLogRepository, userRepository, objectMapper);
        auditAspect = new AuditAspect(auditService);

        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
        AuditContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
        AuditContextHolder.clear();
    }

    // Dummy service interface & implementation để test reflection & SpEL
    interface SampleService {
        @Auditable(action = "UPDATE_ATTENDANCE", entityType = "ATTENDANCE_LOG", entityId = "#logId")
        SampleResult updateAttendance(Long logId, String newStatus);

        @Auditable(action = "CREATE_USER", entityType = "USER", entityId = "#result.id")
        SampleResult createUser(String email);

        @Auditable(action = "FALLBACK_ACTION", entityType = "ATTENDANCE_LOG")
        void doSomethingWithoutId(Long targetId);
    }

    record SampleResult(Long id, String status) {
    }

    @Test
    @DisplayName("AuditAspect: Ghi nhận kiểm toán thành công khi có đầy đủ SecurityContext và RequestContext")
    void auditMethod_withFullContext_shouldPersistAuditLog() throws Throwable {
        // GIVEN: Đăng nhập với tài khoản HR
        String hrEmail = "hr@fas.com";
        User hrUser = User.builder().id(99L).email(hrEmail).employeeCode("EMP099").fullName("HR Manager").build();
        when(userRepository.findByEmail(hrEmail)).thenReturn(Optional.of(hrUser));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(hrEmail, null, Collections.emptyList())
        );

        // GIVEN: HTTP Request có header X-Forwarded-For
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Forwarded-For", "203.0.113.195, 10.0.0.1");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        // GIVEN: JoinPoint cho phương thức updateAttendance
        Method method = SampleService.class.getMethod("updateAttendance", Long.class, String.class);
        Auditable auditable = method.getAnnotation(Auditable.class);
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{101L, "ON_TIME"});
        SampleResult expectedResult = new SampleResult(101L, "ON_TIME");
        when(joinPoint.proceed()).thenReturn(expectedResult);

        // Ghi nhận AuditLogRepository save
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        Object result = auditAspect.auditMethod(joinPoint, auditable);

        // THEN
        assertThat(result).isEqualTo(expectedResult);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(1)).save(captor.capture());
        AuditLog savedLog = captor.getValue();

        assertThat(savedLog.getAction()).isEqualTo("UPDATE_ATTENDANCE");
        assertThat(savedLog.getEntityType()).isEqualTo("ATTENDANCE_LOG");
        assertThat(savedLog.getEntityId()).isEqualTo("101");
        assertThat(savedLog.getActor()).isEqualTo(hrUser);
        assertThat(savedLog.getActorEmail()).isEqualTo(hrEmail);
        assertThat(savedLog.getIpAddress()).isEqualTo("203.0.113.195");
        assertThat(savedLog.getAfterState()).contains("ON_TIME");
    }

    @Test
    @DisplayName("AuditAspect: Chụp beforeState và entityId từ AuditContextHolder")
    void auditMethod_withAuditContextHolder_shouldCaptureBeforeAndAfterStates() throws Throwable {
        // GIVEN: Đặt beforeState và entityId thủ công trong AuditContextHolder
        AuditContextHolder.setEntityId("LOG-999");
        AuditContextHolder.setBeforeState(Map.of("id", 999, "status", "LATE", "lateMinutes", 15));

        Method method = SampleService.class.getMethod("updateAttendance", Long.class, String.class);
        Auditable auditable = method.getAnnotation(Auditable.class);
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{999L, "ON_TIME"});

        SampleResult resultDto = new SampleResult(999L, "ON_TIME");
        when(joinPoint.proceed()).thenReturn(resultDto);
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        auditAspect.auditMethod(joinPoint, auditable);

        // THEN
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();

        assertThat(saved.getEntityId()).isEqualTo("LOG-999");
        assertThat(saved.getBeforeState()).contains("LATE");
        assertThat(saved.getBeforeState()).contains("15");
        assertThat(saved.getAfterState()).contains("ON_TIME");

        // Đảm bảo AuditContextHolder được dọn sạch sau khi Aspect chạy xong
        assertThat(AuditContextHolder.getBeforeState()).isNull();
        assertThat(AuditContextHolder.getEntityId()).isNull();
    }

    @Test
    @DisplayName("AuditAspect: Fallback tác nhân SYSTEM và IP mặc định khi không có ngữ cảnh Web/Auth")
    void auditMethod_withoutContext_shouldFallbackToSystemAndDefaultIp() throws Throwable {
        // GIVEN: Không có SecurityContext và RequestContext (background job)
        Method method = SampleService.class.getMethod("updateAttendance", Long.class, String.class);
        Auditable auditable = method.getAnnotation(Auditable.class);
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{555L, "ON_TIME"});
        when(joinPoint.proceed()).thenReturn(new SampleResult(555L, "ON_TIME"));
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        auditAspect.auditMethod(joinPoint, auditable);

        // THEN
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();

        assertThat(saved.getActor()).isNull();
        assertThat(saved.getActorEmail()).isEqualTo("SYSTEM");
        assertThat(saved.getIpAddress()).isEqualTo("127.0.0.1");
    }

    @Test
    @DisplayName("AuditAspect: Trích xuất IP từ header X-Real-IP và RemoteAddr")
    void auditService_resolveClientIpAddress_shouldHandleVariousHeaders() {
        // Test X-Real-IP
        MockHttpServletRequest req1 = new MockHttpServletRequest();
        req1.addHeader("X-Real-IP", "10.10.1.50");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req1));
        assertThat(auditService.resolveClientIpAddress()).isEqualTo("10.10.1.50");

        // Test RemoteAddr fallback
        MockHttpServletRequest req2 = new MockHttpServletRequest();
        req2.setRemoteAddr("172.16.0.22");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req2));
        assertThat(auditService.resolveClientIpAddress()).isEqualTo("172.16.0.22");
    }

    @Test
    @DisplayName("AuditAspect: Trích xuất entityId từ kết quả trả về (#result.id)")
    void auditMethod_withSpelEntityIdFromResult_shouldResolveEntityId() throws Throwable {
        Method method = SampleService.class.getMethod("createUser", String.class);
        Auditable auditable = method.getAnnotation(Auditable.class);
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{"newuser@fas.com"});

        SampleResult resultDto = new SampleResult(777L, "ACTIVE");
        when(joinPoint.proceed()).thenReturn(resultDto);
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        auditAspect.auditMethod(joinPoint, auditable);

        // THEN
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();

        assertThat(saved.getAction()).isEqualTo("CREATE_USER");
        assertThat(saved.getEntityType()).isEqualTo("USER");
        assertThat(saved.getEntityId()).isEqualTo("777");
    }

    @Test
    @DisplayName("AuditAspect: Ném ngoại lệ khi phương thức nghiệp vụ fail và không leak ThreadLocal")
    void auditMethod_whenMethodFails_shouldPropagateExceptionAndClearContext() throws Throwable {
        AuditContextHolder.setBeforeState("dirty-state");
        Method method = SampleService.class.getMethod("updateAttendance", Long.class, String.class);
        Auditable auditable = method.getAnnotation(Auditable.class);
        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{123L, "ON_TIME"});
        when(joinPoint.proceed()).thenThrow(new IllegalStateException("Lỗi nghiệp vụ"));

        // WHEN & THEN
        assertThatThrownBy(() -> auditAspect.auditMethod(joinPoint, auditable))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Lỗi nghiệp vụ");

        verify(auditLogRepository, never()).save(any());
        assertThat(AuditContextHolder.getBeforeState()).isNull();
    }
}
