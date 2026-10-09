package com.fas.service;

import com.fas.api.dto.request.AssignShiftRequest;
import com.fas.api.dto.request.CreateShiftRequest;
import com.fas.api.dto.request.UpdateShiftRequest;
import com.fas.api.dto.response.EmployeeShiftResponse;
import com.fas.api.dto.response.ShiftEvaluationResult;
import com.fas.api.dto.response.ShiftResponse;
import com.fas.api.error.ApiErrorCode;
import com.fas.api.error.ApiException;
import com.fas.data.entity.EmployeeShift;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.repository.EmployeeShiftRepository;
import com.fas.data.repository.ShiftRepository;
import com.fas.data.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Dịch vụ Quản lý Ca kíp & Phân ca Nhân sự
 * (SOL-BE-017, FR-BE-013, DATA-BE-017, DD-BE-017, BLD-BE-024, TASK-BE-029).
 *
 * <p>Quy tắc nghiệp vụ:
 * <ul>
 *   <li>Quản lý ca làm việc: mã duy nhất, {@code startTime < endTime}, ân hạn 0-60 phút.</li>
 *   <li>Vô hiệu hóa ca: từ chối ném 409 {@code SHIFT_IN_USE} nếu ca đang được phân công cho nhân sự.</li>
 *   <li>Phân ca nhân sự: kiểm tra chồng lấn khoảng hiệu lực {@code [effectiveFrom, effectiveTo]};
 *       từ chối ném 409 {@code SHIFT_OVERLAPPING} nếu khoảng hiệu lực giao nhau với phân ca hiện có của nhân sự.</li>
 *   <li>Đánh giá ca điểm danh: tính số phút trễ ({@code lateMinutes}) theo giờ bắt đầu và thời gian ân hạn của ca;
 *       trả về trạng thái {@code ANOMALOUS} khi nhân sự chưa được phân ca.</li>
 * </ul>
 */
@Service
public class ShiftManagementService {

    private static final Logger logger = LoggerFactory.getLogger(ShiftManagementService.class);

    private final ShiftRepository shiftRepository;
    private final EmployeeShiftRepository employeeShiftRepository;
    private final UserRepository userRepository;

    public ShiftManagementService(
            ShiftRepository shiftRepository,
            EmployeeShiftRepository employeeShiftRepository,
            UserRepository userRepository) {
        this.shiftRepository = shiftRepository;
        this.employeeShiftRepository = employeeShiftRepository;
        this.userRepository = userRepository;
    }

    /**
     * Khởi tạo ca làm việc mới trong danh mục.
     *
     * @param request thông tin ca làm việc cần tạo
     * @return thông tin ca làm việc sau khi lưu
     */
    @Transactional
    public ShiftResponse createShift(CreateShiftRequest request) {
        String shiftCode = request.shiftCode().trim();
        if (shiftRepository.existsByShiftCode(shiftCode)) {
            throw new ApiException(ApiErrorCode.DATA_INTEGRITY_VIOLATION,
                    "Mã ca làm việc '" + shiftCode + "' đã tồn tại.");
        }

        validateShiftTimes(request.startTime(), request.endTime(), request.gracePeriodMinutes());

        Shift shift = Shift.builder()
                .shiftCode(shiftCode)
                .shiftName(request.shiftName().trim())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .gracePeriodMinutes(request.gracePeriodMinutes())
                .isActive(true)
                .build();

        Shift saved = shiftRepository.save(shift);
        logger.info("Khởi tạo ca làm việc thành công: ID={}, Code={}", saved.getId(), saved.getShiftCode());
        return toShiftResponse(saved);
    }

    /**
     * Cập nhật thông tin ca làm việc hiện có.
     *
     * @param shiftId mã định danh ca làm việc
     * @param request thông tin cập nhật
     * @return thông tin ca làm việc sau cập nhật
     */
    @Transactional
    public ShiftResponse updateShift(Long shiftId, UpdateShiftRequest request) {
        Shift shift = findShiftById(shiftId);

        validateShiftTimes(request.startTime(), request.endTime(), request.gracePeriodMinutes());

        shift.setShiftName(request.shiftName().trim());
        shift.setStartTime(request.startTime());
        shift.setEndTime(request.endTime());
        shift.setGracePeriodMinutes(request.gracePeriodMinutes());

        if (request.isActive() != null) {
            if (!request.isActive() && Boolean.TRUE.equals(shift.getIsActive())) {
                checkShiftNotInUse(shiftId);
            }
            shift.setIsActive(request.isActive());
        }

        Shift updated = shiftRepository.save(shift);
        logger.info("Cập nhật ca làm việc thành công: ID={}, Code={}", updated.getId(), updated.getShiftCode());
        return toShiftResponse(updated);
    }

    /**
     * Vô hiệu hóa ca làm việc.
     *
     * @param shiftId mã định danh ca cần vô hiệu hóa
     * @return thông tin ca sau khi cập nhật
     */
    @Transactional
    public ShiftResponse deactivateShift(Long shiftId) {
        Shift shift = findShiftById(shiftId);
        checkShiftNotInUse(shiftId);

        shift.setIsActive(false);
        Shift updated = shiftRepository.save(shift);
        logger.info("Vô hiệu hóa ca làm việc thành công: ID={}, Code={}", updated.getId(), updated.getShiftCode());
        return toShiftResponse(updated);
    }

    /**
     * Kích hoạt lại ca làm việc.
     *
     * @param shiftId mã định danh ca cần kích hoạt
     * @return thông tin ca sau khi kích hoạt
     */
    @Transactional
    public ShiftResponse activateShift(Long shiftId) {
        Shift shift = findShiftById(shiftId);
        shift.setIsActive(true);
        Shift updated = shiftRepository.save(shift);
        logger.info("Kích hoạt lại ca làm việc thành công: ID={}, Code={}", updated.getId(), updated.getShiftCode());
        return toShiftResponse(updated);
    }

    /**
     * Lấy chi tiết thông tin ca làm việc theo ID.
     */
    @Transactional(readOnly = true)
    public ShiftResponse getShift(Long shiftId) {
        return toShiftResponse(findShiftById(shiftId));
    }

    /**
     * Lấy danh sách tất cả các ca làm việc trong hệ thống.
     *
     * @param activeOnly true nếu chỉ muốn lấy các ca đang kích hoạt
     */
    @Transactional(readOnly = true)
    public List<ShiftResponse> getAllShifts(Boolean activeOnly) {
        List<Shift> shifts = Boolean.TRUE.equals(activeOnly)
                ? shiftRepository.findByIsActiveTrue()
                : shiftRepository.findAll();
        return shifts.stream().map(this::toShiftResponse).toList();
    }

    /**
     * Phân công ca làm việc cho nhân viên theo khoảng thời gian hiệu lực.
     * Kiểm tra chặt chẽ điều kiện không chồng lấn khoảng hiệu lực của cùng một nhân sự.
     *
     * @param request thông tin phân công ca
     * @return bản ghi phân công sau khi lưu
     */
    @Transactional
    public EmployeeShiftResponse assignShift(AssignShiftRequest request) {
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ApiException(ApiErrorCode.EMPLOYEE_NOT_FOUND,
                        "Không tìm thấy nhân sự với ID: " + request.userId()));

        if (user.getStatus() == EmployeeStatus.TERMINATED || user.getStatus() == EmployeeStatus.SUSPENDED) {
            throw new ApiException(ApiErrorCode.ACCESS_DENIED,
                    "Không thể phân ca cho nhân sự không ở trạng thái hoạt động.");
        }

        Shift shift = findShiftById(request.shiftId());
        if (!Boolean.TRUE.equals(shift.getIsActive())) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Không thể phân ca đã bị vô hiệu hóa.");
        }

        LocalDate from = request.effectiveFrom();
        LocalDate to = request.effectiveTo();
        if (to != null && from.isAfter(to)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Ngày bắt đầu hiệu lực phải nhỏ hơn hoặc bằng ngày kết thúc.");
        }

        // Kiểm tra chồng lấn khoảng hiệu lực đối với các phân ca hiện có của nhân sự (DD-BE-017)
        List<EmployeeShift> existingAssignments = employeeShiftRepository.findByUserId(user.getId());
        for (EmployeeShift existing : existingAssignments) {
            if (isOverlapping(from, to, existing.getEffectiveFrom(), existing.getEffectiveTo())) {
                String existingRange = existing.getEffectiveFrom() + " đến "
                        + (existing.getEffectiveTo() != null ? existing.getEffectiveTo() : "vô thời hạn");
                String requestedRange = from + " đến " + (to != null ? to : "vô thời hạn");
                logger.warn("Phân ca thất bại do chồng lấn khoảng hiệu lực: User={}, Yêu cầu={}, Đã có={} (Ca={})",
                        user.getEmployeeCode(), requestedRange, existingRange, existing.getShift().getShiftCode());
                throw new ApiException(ApiErrorCode.SHIFT_OVERLAPPING,
                        "Khoảng thời gian hiệu lực (" + requestedRange + ") bị chồng lấn với phân ca hiện có ("
                                + existingRange + ", Ca: " + existing.getShift().getShiftCode() + ").");
            }
        }

        EmployeeShift employeeShift = EmployeeShift.builder()
                .user(user)
                .shift(shift)
                .effectiveFrom(from)
                .effectiveTo(to)
                .build();

        EmployeeShift saved = employeeShiftRepository.save(employeeShift);
        logger.info("Phân ca thành công: ID={}, User={}, Shift={}, Range=[{}, {}]",
                saved.getId(), user.getEmployeeCode(), shift.getShiftCode(), from, to);
        return toEmployeeShiftResponse(saved);
    }

    /**
     * Gỡ bỏ phân công ca làm việc của nhân sự.
     *
     * @param employeeShiftId mã định danh bản ghi phân ca
     */
    @Transactional
    public void unassignShift(Long employeeShiftId) {
        EmployeeShift employeeShift = employeeShiftRepository.findById(employeeShiftId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy bản ghi phân ca với ID: " + employeeShiftId));

        employeeShiftRepository.delete(employeeShift);
        logger.info("Gỡ phân ca thành công: ID={}", employeeShiftId);
    }

    /**
     * Tra cứu ca làm việc đang hiệu lực của nhân viên tại ngày cụ thể.
     *
     * @param userId mã định danh nhân viên
     * @param date   ngày cần tra cứu
     * @return ca làm việc đang hiệu lực (nếu có)
     */
    @Transactional(readOnly = true)
    public Optional<Shift> findActiveShiftForUser(Long userId, LocalDate date) {
        return employeeShiftRepository.findActiveShiftForUser(userId, date)
                .map(es -> es.getShift());
    }

    /**
     * Đánh giá lượt điểm danh dựa trên ca làm việc đang hiệu lực của nhân viên.
     *
     * @param userId    định danh nhân viên
     * @param punchDate ngày thực hiện điểm danh
     * @param punchTime giờ thực hiện điểm danh
     * @return kết quả đánh giá chứa trạng thái và số phút đi muộn (nếu có)
     */
    @Transactional(readOnly = true)
    public ShiftEvaluationResult evaluatePunch(Long userId, LocalDate punchDate, LocalTime punchTime) {
        Optional<EmployeeShift> activeAssignmentOpt = employeeShiftRepository.findActiveShiftForUser(userId, punchDate);

        if (activeAssignmentOpt.isEmpty()) {
            logger.warn("Nhân viên ID={} chưa được phân ca vào ngày {}. Trả về trạng thái ANOMALOUS.",
                    userId, punchDate);
            return ShiftEvaluationResult.anomalous();
        }

        Shift shift = activeAssignmentOpt.get().getShift();
        LocalTime startTime = shift.getStartTime();
        int graceMinutes = shift.getGracePeriodMinutes() != null ? shift.getGracePeriodMinutes() : 0;
        LocalTime cutoffTime = startTime.plusMinutes(graceMinutes);

        if (!punchTime.isAfter(cutoffTime)) {
            return ShiftEvaluationResult.onTime(shift.getId(), shift.getShiftCode(), startTime, graceMinutes);
        } else {
            long lateMinutes = Duration.between(startTime, punchTime).toMinutes();
            return ShiftEvaluationResult.late(shift.getId(), shift.getShiftCode(), lateMinutes, startTime, graceMinutes);
        }
    }

    /**
     * Tra cứu danh sách phân ca của nhân sự với các bộ lọc linh hoạt.
     */
    @Transactional(readOnly = true)
    public List<EmployeeShiftResponse> getEmployeeShifts(Long userId, Long shiftId, LocalDate fromDate, LocalDate toDate) {
        List<EmployeeShift> list = (userId != null)
                ? employeeShiftRepository.findByUserId(userId)
                : employeeShiftRepository.findAll();

        return list.stream()
                .filter(es -> shiftId == null || es.getShift().getId().equals(shiftId))
                .filter(es -> fromDate == null || es.getEffectiveTo() == null || !es.getEffectiveTo().isBefore(fromDate))
                .filter(es -> toDate == null || !es.getEffectiveFrom().isAfter(toDate))
                .map(this::toEmployeeShiftResponse)
                .toList();
    }

    /**
     * Kiểm tra xem 2 khoảng thời gian [startA, endA] và [startB, endB] có giao nhau không.
     * Giá trị null ở end đại diện cho vô thời hạn (+vô cực).
     */
    public boolean isOverlapping(LocalDate startA, LocalDate endA, LocalDate startB, LocalDate endB) {
        return (endA == null || !startB.isAfter(endA)) && (endB == null || !startA.isAfter(endB));
    }

    private void checkShiftNotInUse(Long shiftId) {
        LocalDate today = LocalDate.now();
        boolean inUse = employeeShiftRepository.findByShiftId(shiftId).stream()
                .anyMatch(es -> es.getEffectiveTo() == null || !es.getEffectiveTo().isBefore(today));

        if (inUse) {
            throw new ApiException(ApiErrorCode.SHIFT_IN_USE,
                    "Không thể vô hiệu hóa ca làm việc đang được phân công cho nhân sự. Vui lòng gỡ phân ca trước khi vô hiệu hóa.");
        }
    }

    private Shift findShiftById(Long shiftId) {
        return shiftRepository.findById(shiftId)
                .orElseThrow(() -> new ApiException(ApiErrorCode.RESOURCE_NOT_FOUND,
                        "Không tìm thấy ca làm việc với ID: " + shiftId));
    }

    private void validateShiftTimes(LocalTime startTime, LocalTime endTime, Integer gracePeriodMinutes) {
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Giờ bắt đầu ca (" + startTime + ") phải nhỏ hơn giờ kết thúc ca (" + endTime + ").");
        }
        if (gracePeriodMinutes == null || gracePeriodMinutes < 0 || gracePeriodMinutes > 60) {
            throw new ApiException(ApiErrorCode.VALIDATION_FAILED,
                    "Thời gian ân hạn phải nằm trong khoảng từ 0 đến 60 phút.");
        }
    }

    private ShiftResponse toShiftResponse(Shift shift) {
        return new ShiftResponse(
                shift.getId(),
                shift.getShiftCode(),
                shift.getShiftName(),
                shift.getStartTime(),
                shift.getEndTime(),
                shift.getGracePeriodMinutes(),
                shift.getIsActive()
        );
    }

    private EmployeeShiftResponse toEmployeeShiftResponse(EmployeeShift es) {
        return new EmployeeShiftResponse(
                es.getId(),
                es.getUser().getId(),
                es.getUser().getEmployeeCode(),
                es.getUser().getFullName(),
                es.getShift().getId(),
                es.getShift().getShiftCode(),
                es.getShift().getShiftName(),
                es.getEffectiveFrom(),
                es.getEffectiveTo()
        );
    }
}
