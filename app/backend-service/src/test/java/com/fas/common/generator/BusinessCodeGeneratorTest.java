package com.fas.common.generator;

import com.fas.data.entity.Kiosk;
import com.fas.data.entity.Shift;
import com.fas.data.entity.User;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.ShiftRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử bộ sinh mã nghiệp vụ thông minh BusinessCodeGenerator")
class BusinessCodeGeneratorTest {

    @Mock
    private ShiftRepository shiftRepository;

    @Mock
    private KioskRepository kioskRepository;

    @Mock
    private UserRepository userRepository;

    private BusinessCodeGenerator generator;

    private static final Instant FIXED_INSTANT = Instant.parse("2026-11-19T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);
        generator = new BusinessCodeGenerator(shiftRepository, kioskRepository, userRepository, fixedClock);
    }

    @Nested
    @DisplayName("1. Sinh mã ca làm việc (generateShiftCode)")
    class GenerateShiftCodeTests {

        @Test
        @DisplayName("Ca sáng 06:00 - 14:00 sinh mã SHF-SANG-0614")
        void generateShiftCode_MorningShift() {
            when(shiftRepository.existsByShiftCode("SHF-SANG-0614")).thenReturn(false);

            String code = generator.generateShiftCode("Ca Sáng", LocalTime.of(6, 0), LocalTime.of(14, 0));

            assertThat(code).isEqualTo("SHF-SANG-0614");
        }

        @Test
        @DisplayName("Ca chiều 14:00 - 22:00 sinh mã SHF-CHIEU-1422")
        void generateShiftCode_AfternoonShift() {
            when(shiftRepository.existsByShiftCode("SHF-CHIEU-1422")).thenReturn(false);

            String code = generator.generateShiftCode("Ca Chiều", LocalTime.of(14, 0), LocalTime.of(22, 0));

            assertThat(code).isEqualTo("SHF-CHIEU-1422");
        }

        @Test
        @DisplayName("Ca đêm 22:00 - 06:00 sinh mã SHF-DEM-2206")
        void generateShiftCode_NightShift() {
            when(shiftRepository.existsByShiftCode("SHF-DEM-2206")).thenReturn(false);

            String code = generator.generateShiftCode("Ca Đêm", LocalTime.of(22, 0), LocalTime.of(6, 0));

            assertThat(code).isEqualTo("SHF-DEM-2206");
        }

        @Test
        @DisplayName("Ca gãy có phút lẻ 08:30 - 17:30 sinh mã SHF-GAY-08301730")
        void generateShiftCode_SplitShiftWithMinutes() {
            when(shiftRepository.existsByShiftCode("SHF-GAY-08301730")).thenReturn(false);

            String code = generator.generateShiftCode("Ca Gãy", LocalTime.of(8, 30), LocalTime.of(17, 30));

            assertThat(code).isEqualTo("SHF-GAY-08301730");
        }

        @Test
        @DisplayName("Ca hành chính 08:00 - 17:00 trùng lặp -> sinh ra SHF-HC-0817-02")
        void generateShiftCode_Duplicate_AppendsSequence() {
            when(shiftRepository.existsByShiftCode("SHF-HC-0817")).thenReturn(true);
            when(shiftRepository.findTopByShiftCodeStartingWithOrderByShiftCodeDesc("SHF-HC-0817-")).thenReturn(Optional.empty());

            String code = generator.generateShiftCode("Hành chính", LocalTime.of(8, 0), LocalTime.of(17, 0));

            assertThat(code).isEqualTo("SHF-HC-0817-02");
        }

        @Test
        @DisplayName("Trùng lặp nhiều lần ca hành chính -> sinh ra SHF-HC-0817-03")
        void generateShiftCode_MultipleDuplicates_AppendsNextSequence() {
            when(shiftRepository.existsByShiftCode("SHF-HC-0817")).thenReturn(true);
            when(shiftRepository.findTopByShiftCodeStartingWithOrderByShiftCodeDesc("SHF-HC-0817-"))
                    .thenReturn(Optional.of(Shift.builder().shiftCode("SHF-HC-0817-02").build()));

            String code = generator.generateShiftCode("Ca Hành Chính", LocalTime.of(8, 0), LocalTime.of(17, 0));

            assertThat(code).isEqualTo("SHF-HC-0817-03");
        }
    }

    @Nested
    @DisplayName("2. Sinh mã trạm Kiosk (generateKioskId)")
    class GenerateKioskIdTests {

        @Test
        @DisplayName("Trạm tại 'Cổng chính Hà Nội' sinh mã KSK-HN-01")
        void generateKioskId_Hanoi() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-HN-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("Cổng chính Hà Nội");

            assertThat(kioskId).isEqualTo("KSK-HN-01");
        }

        @Test
        @DisplayName("Trạm tại 'Tòa nhà Bitexco, TP.HCM' sinh mã KSK-HCM-01")
        void generateKioskId_Hcm() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-HCM-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("Tòa nhà Bitexco, TP.HCM");

            assertThat(kioskId).isEqualTo("KSK-HCM-01");
        }

        @Test
        @DisplayName("Trạm tại 'Văn phòng Hồ Chí Minh - Tầng 5' sinh mã KSK-HCM-FL05")
        void generateKioskId_HcmWithFloor() {
            when(kioskRepository.existsById("KSK-HCM-FL05")).thenReturn(false);

            String kioskId = generator.generateKioskId("Văn phòng Hồ Chí Minh - Tầng 5");

            assertThat(kioskId).isEqualTo("KSK-HCM-FL05");
        }

        @Test
        @DisplayName("Trạm tại 'Chi nhánh Đà Nẵng' sinh mã KSK-DN-01")
        void generateKioskId_DaNang() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-DN-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("Chi nhánh Đà Nẵng");

            assertThat(kioskId).isEqualTo("KSK-DN-01");
        }

        @Test
        @DisplayName("Trạm tại 'Khu công nghiệp Bắc Ninh' sinh mã KSK-BN-01")
        void generateKioskId_BacNinh() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-BN-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("Khu công nghiệp Bắc Ninh");

            assertThat(kioskId).isEqualTo("KSK-BN-01");
        }

        @Test
        @DisplayName("Trạm tại 'Kho tổng' sinh mã KSK-KHO-01")
        void generateKioskId_Warehouse() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-KHO-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("Kho tổng");

            assertThat(kioskId).isEqualTo("KSK-KHO-01");
        }

        @Test
        @DisplayName("Trạm bị trùng lặp -> tự động tăng số thứ tự KSK-HN-02")
        void generateKioskId_Duplicate_IncrementsSequence() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-HN-"))
                    .thenReturn(Optional.of(Kiosk.builder().id("KSK-HN-01").build()));

            String kioskId = generator.generateKioskId("Hà Nội");

            assertThat(kioskId).isEqualTo("KSK-HN-02");
        }

        @Test
        @DisplayName("Địa điểm trống -> fallback KSK-GEN-01")
        void generateKioskId_BlankLocation_FallbackGen() {
            when(kioskRepository.findTopByIdStartingWithOrderByIdDesc("KSK-GEN-")).thenReturn(Optional.empty());

            String kioskId = generator.generateKioskId("");

            assertThat(kioskId).isEqualTo("KSK-GEN-01");
        }
    }

    @Nested
    @DisplayName("3. Sinh mã nhân viên (generateEmployeeCode)")
    class GenerateEmployeeCodeTests {

        @Test
        @DisplayName("Nhân viên phòng ban 'Kỹ thuật' năm 2026 sinh mã EMP-ENG-260001")
        void generateEmployeeCode_Engineering() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-ENG-26")).thenReturn(Optional.empty());

            String code = generator.generateEmployeeCode("Phòng Kỹ thuật");

            assertThat(code).isEqualTo("EMP-ENG-260001");
        }

        @Test
        @DisplayName("Nhân viên phòng ban 'Nhân sự' sinh mã EMP-HR-260001")
        void generateEmployeeCode_HumanResources() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-HR-26")).thenReturn(Optional.empty());

            String code = generator.generateEmployeeCode("Phòng Nhân sự");

            assertThat(code).isEqualTo("EMP-HR-260001");
        }

        @Test
        @DisplayName("Nhân viên phòng ban 'Kinh doanh' sinh mã EMP-SAL-260001")
        void generateEmployeeCode_Sales() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-SAL-26")).thenReturn(Optional.empty());

            String code = generator.generateEmployeeCode("Phòng Kinh doanh");

            assertThat(code).isEqualTo("EMP-SAL-260001");
        }

        @Test
        @DisplayName("Nhân viên phòng ban 'Kế toán - Tài chính' sinh mã EMP-ACC-260001")
        void generateEmployeeCode_Accounting() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-ACC-26")).thenReturn(Optional.empty());

            String code = generator.generateEmployeeCode("Phòng Kế toán - Tài chính");

            assertThat(code).isEqualTo("EMP-ACC-260001");
        }

        @Test
        @DisplayName("Trùng mã nhân viên -> tự động tăng số thứ tự EMP-ENG-260002")
        void generateEmployeeCode_Duplicate_IncrementsSequence() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-ENG-26"))
                    .thenReturn(Optional.of(User.builder().employeeCode("EMP-ENG-260001").build()));

            String code = generator.generateEmployeeCode("Kỹ thuật");

            assertThat(code).isEqualTo("EMP-ENG-260002");
        }

        @Test
        @DisplayName("Phòng ban trống -> fallback EMP-GEN-260001")
        void generateEmployeeCode_BlankDepartment_FallbackGen() {
            when(userRepository.findTopByEmployeeCodeStartingWithOrderByEmployeeCodeDesc("EMP-GEN-26")).thenReturn(Optional.empty());

            String code = generator.generateEmployeeCode("");

            assertThat(code).isEqualTo("EMP-GEN-260001");
        }
    }
}
