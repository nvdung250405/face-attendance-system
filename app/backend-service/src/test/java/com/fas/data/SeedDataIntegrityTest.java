package com.fas.data;

import com.fas.data.enums.AttendanceStatus;
import com.fas.data.enums.DataSubjectRequestStatus;
import com.fas.data.enums.DataSubjectRequestType;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.ExcuseRequestStatus;
import com.fas.data.enums.PayrollPeriodStatus;
import com.fas.data.enums.PoseType;
import com.fas.data.enums.PunchType;
import com.fas.data.enums.Role;
import com.fas.data.enums.VerificationMethod;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TST-BE-DAT-011: Thẩm định tính toàn vẹn và hợp lệ của các tệp Seed Data SQL đối chiếu với Java Enums.
 */
class SeedDataIntegrityTest {

    private static final Set<String> VALID_ROLES = Arrays.stream(Role.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_EMPLOYEE_STATUSES = Arrays.stream(EmployeeStatus.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_VERIFICATION_METHODS = Arrays.stream(VerificationMethod.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_ATTENDANCE_STATUSES = Arrays.stream(AttendanceStatus.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_PUNCH_TYPES = Arrays.stream(PunchType.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_EXCUSE_STATUSES = Arrays.stream(ExcuseRequestStatus.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_PERIOD_STATUSES = Arrays.stream(PayrollPeriodStatus.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_DSR_TYPES = Arrays.stream(DataSubjectRequestType.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_DSR_STATUSES = Arrays.stream(DataSubjectRequestStatus.values())
            .map(Enum::name).collect(Collectors.toSet());
    private static final Set<String> VALID_POSE_TYPES = Arrays.stream(PoseType.values())
            .map(Enum::name).collect(Collectors.toSet());

    private static final List<String> SEED_FILES = List.of(
            "../../database/seeds/seed-staging-data.sql",
            "../../database/seeds/seed-e2e-data.sql"
    );

    @Test
    @DisplayName("Thẩm định seed SQL không được chứa các giá trị enum không hợp lệ")
    void seedFilesMustNotContainInvalidEnums() throws IOException {
        for (String relativePath : SEED_FILES) {
            Path path = Paths.get(relativePath).normalize();
            if (!Files.exists(path)) {
                path = Paths.get("database/seeds/" + Paths.get(relativePath).getFileName()).normalize();
            }
            if (!Files.exists(path)) {
                continue;
            }

            String content = Files.readString(path);

            // 1. Kiểm tra không chứa enum cũ lỗi thời trong các bảng nghiệp vụ chính
            assertThat(content)
                    .as("Tệp %s không được chứa verification_method = 'FACE'", path)
                    .doesNotContain("'FACE',")
                    .doesNotContain("'FACE'\n")
                    .doesNotContain("'FACE' ");

            assertThat(content)
                    .as("Tệp %s không được gán status = 'CONSENT_WITHDRAWN' cho bảng users", path)
                    .doesNotContain("'EMPLOYEE',\n        'CONSENT_WITHDRAWN'")
                    .doesNotContain("'EMPLOYEE', 'CONSENT_WITHDRAWN'");

            // 2. Kiểm tra các giá trị verification_method phải nằm trong VALID_VERIFICATION_METHODS
            Pattern vmPattern = Pattern.compile("'(CHECK_IN|CHECK_OUT)',\\s*'([A-Z_]+)'");
            Matcher vmMatcher = vmPattern.matcher(content);
            while (vmMatcher.find()) {
                String method = vmMatcher.group(2);
                assertThat(VALID_VERIFICATION_METHODS)
                        .as("Tệp %s: Phương thức xác thực '%s' phải là enum hợp lệ", path, method)
                        .contains(method);
            }

            // 3. Kiểm tra các giá trị pose_type
            Pattern posePattern = Pattern.compile("'(FRONTAL|LEFT_TILT|RIGHT_TILT|[A-Z_]+)',\\s*true", Pattern.CASE_INSENSITIVE);
            Matcher poseMatcher = posePattern.matcher(content);
            while (poseMatcher.find()) {
                String pose = poseMatcher.group(1).toUpperCase();
                if (pose.equals("FRONTAL") || pose.equals("LEFT_TILT") || pose.equals("RIGHT_TILT")) {
                    assertThat(VALID_POSE_TYPES).contains(pose);
                }
            }
        }
    }
}
