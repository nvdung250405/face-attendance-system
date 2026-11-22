package com.fas.service;

import com.fas.api.dto.ApiResponse;
import com.fas.api.dto.response.AttendanceLogItem;
import com.fas.api.dto.response.DailyAttendanceItem;
import com.fas.api.dto.response.PersonalAttendanceResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.AttendanceLog;
import com.fas.data.entity.User;
import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.PunchType;
import com.fas.data.repository.AttendanceLogRepository;
import com.fas.data.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Dịch vụ Tra cứu Lịch sử Chấm công Tự phục vụ (SOL-BE-028, FR-BE-025, DD-BE-019).
 *
 * <p>Quy tắc:
 * <ul>
 *   <li>Chỉ trả về các bản ghi thuộc về chính người dùng đang đăng nhập (chống truy cập chéo).</li>
 *   <li>Tổng hợp bảng công theo tháng (thống kê tổng ngày làm việc, đi đúng giờ, đi trễ, chi tiết từng ngày).</li>
 *   <li>Hỗ trợ phân trang danh sách các lượt chấm công cá nhân.</li>
 * </ul>
 */
@Slf4j
@Service
public class EmployeeAttendanceQueryService {

    private final AttendanceLogRepository attendanceLogRepository;
    private final UserRepository userRepository;

    @Autowired
    public EmployeeAttendanceQueryService(
            AttendanceLogRepository attendanceLogRepository,
            UserRepository userRepository) {
        this.attendanceLogRepository = attendanceLogRepository;
        this.userRepository = userRepository;
    }

    /**
     * Tra cứu bảng công cá nhân tổng hợp theo tháng của chính nhân viên.
     *
     * @param userId ID của nhân viên đăng nhập
     * @param year   năm cần tra cứu
     * @param month  tháng cần tra cứu (1-12)
     * @return bảng công cá nhân tổng hợp kèm danh sách ngày làm việc
     */
    @Transactional(readOnly = true)
    public PersonalAttendanceResponse getMonthlyPersonalAttendance(Long userId, int year, int month) {
        validateYearMonth(year, month);
        ensureUserExists(userId);

        YearMonth ym = YearMonth.of(year, month);
        Instant startInstant = ym.atDay(1).atStartOfDay(ApiResponse.VIETNAM_ZONE).toInstant();
        Instant endInstant = ym.atEndOfMonth().atTime(23, 59, 59, 999_999_999).atZone(ApiResponse.VIETNAM_ZONE).toInstant();

        // Lấy tất cả lượt chấm công của nhân viên trong tháng
        Page<AttendanceLog> logsPage = attendanceLogRepository.findByUserIdAndPunchTimestampBetween(
                userId, startInstant, endInstant, Pageable.unpaged());
        List<AttendanceLog> logs = logsPage.getContent();

        // Nhóm các lượt chấm công theo ngày (theo múi giờ chuẩn Việt Nam)
        Map<LocalDate, List<AttendanceLog>> logsByDate = logs.stream()
                .collect(Collectors.groupingBy(log ->
                        log.getPunchTimestamp().atZone(ApiResponse.VIETNAM_ZONE).toLocalDate()));

        List<DailyAttendanceItem> dailyItems = new ArrayList<>();
        int totalOnTimeDays = 0;
        int totalLateDays = 0;

        for (Map.Entry<LocalDate, List<AttendanceLog>> entry : logsByDate.entrySet()) {
            LocalDate date = entry.getKey();
            List<AttendanceLog> dayLogs = entry.getValue();

            dayLogs.sort(Comparator.comparing(AttendanceLog::getPunchTimestamp));

            LocalTime checkInTime = null;
            LocalTime checkOutTime = null;
            Long checkInLogId = null;
            Long checkOutLogId = null;
            int totalLateMinutes = 0;

            for (AttendanceLog l : dayLogs) {
                if (l.getPunchType() == PunchType.CHECK_IN && checkInTime == null) {
                    checkInTime = l.getPunchTimestamp().atZone(ApiResponse.VIETNAM_ZONE).toLocalTime();
                    checkInLogId = l.getId();
                } else if (l.getPunchType() == PunchType.CHECK_OUT) {
                    checkOutTime = l.getPunchTimestamp().atZone(ApiResponse.VIETNAM_ZONE).toLocalTime();
                    checkOutLogId = l.getId();
                }
                if (l.getLateMinutes() != null) {
                    totalLateMinutes += l.getLateMinutes();
                }
            }

            // Nếu chỉ có một lượt quẹt mà không phải CHECK_OUT thì tạm coi là checkInTime
            if (checkInTime == null && !dayLogs.isEmpty()) {
                checkInTime = dayLogs.get(0).getPunchTimestamp().atZone(ApiResponse.VIETNAM_ZONE).toLocalTime();
                checkInLogId = dayLogs.get(0).getId();
            }

            // Xác định trạng thái trong ngày
            AttendanceStatus dayStatus = evaluateDayStatus(dayLogs);
            if (dayStatus == AttendanceStatus.ON_TIME) {
                totalOnTimeDays++;
            } else if (dayStatus == AttendanceStatus.LATE) {
                totalLateDays++;
            }

            dailyItems.add(new DailyAttendanceItem(
                    date,
                    checkInTime,
                    checkOutTime,
                    dayStatus,
                    totalLateMinutes,
                    checkInLogId,
                    checkOutLogId
            ));
        }

        dailyItems.sort(Comparator.comparing(DailyAttendanceItem::date));
        int totalWorkDays = dailyItems.size();

        return new PersonalAttendanceResponse(
                month,
                year,
                totalWorkDays,
                totalOnTimeDays,
                totalLateDays,
                dailyItems
        );
    }

    /**
     * Tra cứu danh sách lượt chấm công chi tiết phân trang của chính nhân viên.
     *
     * @param userId   ID của nhân viên đăng nhập
     * @param year     năm cần lọc (tùy chọn)
     * @param month    tháng cần lọc (tùy chọn)
     * @param pageable thông số phân trang
     * @return trang kết quả các lượt chấm công
     */
    @Transactional(readOnly = true)
    public Page<AttendanceLogItem> getPersonalAttendanceLogs(
            Long userId, Integer year, Integer month, Pageable pageable) {
        ensureUserExists(userId);

        Page<AttendanceLog> page;
        if (year != null && month != null) {
            validateYearMonth(year, month);
            YearMonth ym = YearMonth.of(year, month);
            Instant startInstant = ym.atDay(1).atStartOfDay(ApiResponse.VIETNAM_ZONE).toInstant();
            Instant endInstant = ym.atEndOfMonth().atTime(23, 59, 59, 999_999_999).atZone(ApiResponse.VIETNAM_ZONE).toInstant();
            page = attendanceLogRepository.findByUserIdAndPunchTimestampBetween(userId, startInstant, endInstant, pageable);
        } else {
            page = attendanceLogRepository.findByUserId(userId, pageable);
        }

        return page.map(this::mapToItem);
    }

    /**
     * Kiểm tra chống truy cập chéo dữ liệu của người khác.
     */
    public void assertCanAccess(Long callerUserId, Long targetUserId) {
        if (callerUserId != null && !callerUserId.equals(targetUserId)) {
            throw new ApiException(ApiErrorCode.ACCESS_DENIED,
                    "Không được phép truy cập dữ liệu chấm công của nhân viên khác");
        }
    }

    private void ensureUserExists(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                    "Không tìm thấy nhân viên ID=" + userId);
        }
    }

    private void validateYearMonth(int year, int month) {
        if (year < 2000 || year > 2100) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Năm không hợp lệ: " + year);
        }
        if (month < 1 || month > 12) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED, "Tháng không hợp lệ: " + month);
        }
    }

    private AttendanceStatus evaluateDayStatus(List<AttendanceLog> dayLogs) {
        boolean hasLate = dayLogs.stream().anyMatch(l -> l.getStatus() == AttendanceStatus.LATE);
        if (hasLate) {
            return AttendanceStatus.LATE;
        }
        boolean hasEarlyLeave = dayLogs.stream().anyMatch(l -> l.getStatus() == AttendanceStatus.EARLY_LEAVE);
        if (hasEarlyLeave) {
            return AttendanceStatus.EARLY_LEAVE;
        }
        boolean hasAnomalous = dayLogs.stream().anyMatch(l -> l.getStatus() == AttendanceStatus.ANOMALOUS);
        if (hasAnomalous) {
            return AttendanceStatus.ANOMALOUS;
        }
        return AttendanceStatus.ON_TIME;
    }

    private AttendanceLogItem mapToItem(AttendanceLog log) {
        User user = log.getUser();
        return new AttendanceLogItem(
                log.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getEmployeeCode() : null,
                user != null ? user.getFullName() : null,
                user != null ? user.getDepartment() : null,
                log.getPunchTimestamp().atZone(ApiResponse.VIETNAM_ZONE).toOffsetDateTime(),
                log.getPunchType(),
                log.getVerificationMethod(),
                log.getStatus(),
                log.getLateMinutes() != null ? log.getLateMinutes() : 0,
                log.getKiosk() != null ? log.getKiosk().getId() : null
        );
    }
}
