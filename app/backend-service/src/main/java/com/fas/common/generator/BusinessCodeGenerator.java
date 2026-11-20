package com.fas.common.generator;

import com.fas.common.util.VietnameseStringUtils;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.ShiftRepository;
import com.fas.data.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bộ sinh mã nghiệp vụ thông minh tập trung (Semantic Smart Key Engine).
 * Chịu trách nhiệm phân tích ngữ nghĩa để tự động sinh mã nghiệp vụ duy nhất,
 * thân thiện với con người và chống trùng lặp theo quy tắc nghiệp vụ FAS.
 */
@Component
public class BusinessCodeGenerator {

    private static final Pattern FLOOR_PATTERN = Pattern.compile("(?i)(?:tầng|tang|floor|fl)\\s*0*(\\d+)");

    private final ShiftRepository shiftRepository;
    private final KioskRepository kioskRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @Autowired
    public BusinessCodeGenerator(
            ShiftRepository shiftRepository,
            KioskRepository kioskRepository,
            UserRepository userRepository
    ) {
        this(shiftRepository, kioskRepository, userRepository, Clock.systemDefaultZone());
    }

    public BusinessCodeGenerator(
            ShiftRepository shiftRepository,
            KioskRepository kioskRepository,
            UserRepository userRepository,
            Clock clock
    ) {
        this.shiftRepository = shiftRepository;
        this.kioskRepository = kioskRepository;
        this.userRepository = userRepository;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    /**
     * Sinh mã ca làm việc duy nhất theo chuẩn SHF-[TYPE]-[HHmmHHmm]
     * (ví dụ: SHF-HC-0817, SHF-SANG-0614).
     * Trường hợp trùng lặp sẽ tự động gắn hậu tố số thứ tự tăng dần: -02, -03...
     *
     * @param shiftName tên ca làm việc
     * @param startTime giờ bắt đầu
     * @param endTime   giờ kết thúc
     * @return mã ca làm việc duy nhất
     */
    public String generateShiftCode(String shiftName, LocalTime startTime, LocalTime endTime) {
        String shiftSlug = VietnameseStringUtils.extractShiftSlug(shiftName);
        String timeSlug = VietnameseStringUtils.extractTimeSlug(startTime, endTime);
        String baseCode = "SHF-" + shiftSlug + "-" + timeSlug;

        if (shiftRepository == null || !shiftRepository.existsByShiftCode(baseCode)) {
            return baseCode;
        }

        String prefix = baseCode + "-";
        int seq = 2;
        Optional<Shift> topShift = shiftRepository.findTopByShiftCodeStartingWithOrderByShiftCodeDesc(prefix);
        if (topShift.isPresent()) {
            seq = extractNumericSuffix(topShift.get().getShiftCode(), prefix, 1) + 1;
        }
        String candidate = String.format("%s-%02d", baseCode, seq);
        while (shiftRepository != null && shiftRepository.existsByShiftCode(candidate)) {
            seq++;
            candidate = String.format("%s-%02d", baseCode, seq);
        }
        return candidate;
    }

    /**
     * Sinh mã định danh trạm Kiosk duy nhất theo chuẩn KSK-[LOC]-[STT]
     * (ví dụ: KSK-HN-01, KSK-HCM-FL05).
     * Trường hợp trùng lặp sẽ tự động tăng số thứ tự tuần tự.
     *
     * @param locationName tên vị trí lắp đặt trạm
     * @return mã trạm Kiosk duy nhất
     */
    public String generateKioskId(String locationName) {
        String locSlug = VietnameseStringUtils.extractLocationSlug(locationName);

        Matcher floorMatcher = FLOOR_PATTERN.matcher(locationName != null ? locationName : "");
        if (floorMatcher.find()) {
            int floor = Integer.parseInt(floorMatcher.group(1));
            String baseId = String.format("KSK-%s-FL%02d", locSlug, floor);
            if (kioskRepository == null || !kioskRepository.existsById(baseId)) {
                return baseId;
            }
            String prefix = baseId + "-";
            int seq = 2;
            Optional<Kiosk> topKiosk = kioskRepository.findTopByIdStartingWithOrderByIdDesc(prefix);
            if (topKiosk.isPresent()) {
                seq = extractNumericSuffix(topKiosk.get().getId(), prefix, 1) + 1;
            }
            String candidate = String.format("%s-%02d", baseId, seq);
            while (kioskRepository != null && kioskRepository.existsById(candidate)) {
                seq++;
                candidate = String.format("%s-%02d", baseId, seq);
            }
            return candidate;
        }

        String prefix = String.format("KSK-%s-", locSlug);
        int seq = 1;
        if (kioskRepository != null) {
            Optional<Kiosk> topKiosk = kioskRepository.findTopByIdStartingWithOrderByIdDesc(prefix);
            if (topKiosk.isPresent()) {
                seq = extractNumericSuffix(topKiosk.get().getId(), prefix, 0) + 1;
            }
        }
        String candidate = String.format("KSK-%s-%02d", locSlug, seq);
        while (kioskRepository != null && kioskRepository.existsById(candidate)) {
            seq++;
            candidate = String.format("KSK-%s-%02d", locSlug, seq);
        }
        return candidate;
    }

    /**
     * Sinh mã định danh nhân viên duy nhất theo chuẩn EMP-[DEPT]-[YY][SEQ]
     * (ví dụ: EMP-ENG-260001).
     * Trường hợp trùng lặp sẽ tự động tăng số thứ tự 4 chữ số tuần tự.
     *
     * @param department tên phòng ban hoặc bộ phận công tác
     * @return mã nhân viên duy nhất
     */
    public String generateEmployeeCode(String department) {
        String deptSlug = VietnameseStringUtils.extractDepartmentSlug(department);
        int year = LocalDate.now(clock).getYear() % 100;
        String yy = String.format("%02d", year);
        String prefix = String.format("EMP-%s-%s", deptSlug, yy);

        int seq = 1;
        if (userRepository != null) {
            Optional<User> topUser = userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc(prefix);
            if (topUser.isPresent()) {
                seq = extractNumericSuffix(topUser.get().getEmployeeCode(), prefix, 0) + 1;
            }
        }
        String candidate = String.format("EMP-%s-%s%04d", deptSlug, yy, seq);
        while (userRepository != null && userRepository.existsByEmployeeCode(candidate)) {
            seq++;
            candidate = String.format("EMP-%s-%s%04d", deptSlug, yy, seq);
        }
        return candidate;
    }

    private int extractNumericSuffix(String fullCode, String prefix, int defaultSeq) {
        if (fullCode != null && fullCode.length() > prefix.length()) {
            String suffix = fullCode.substring(prefix.length());
            try {
                return Integer.parseInt(suffix);
            } catch (NumberFormatException ignored) {
                // Ignore and use defaultSeq
            }
        }
        return defaultSeq;
    }
}
