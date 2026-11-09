package com.fas.service;

import com.fas.api.dto.request.ConsentRequest;
import com.fas.api.dto.request.KioskEnrollFaceRequest;
import com.fas.api.dto.request.KioskVerifyOtpRequest;
import com.fas.api.dto.request.PoseTemplateDto;
import com.fas.api.dto.response.ConsentResult;
import com.fas.api.dto.response.EnrollmentResult;
import com.fas.api.dto.response.OtpVerificationResult;
import com.fas.api.error.ApiException;
import com.fas.data.crypto.BiometricCryptoService;
import com.fas.data.entity.BiometricTemplate;
import com.fas.data.entity.Kiosk;
import com.fas.data.entity.User;
import com.fas.data.enums.EmployeeStatus;
import com.fas.data.enums.PoseType;
import com.fas.data.enums.Role;
import com.fas.data.repository.BiometricTemplateRepository;
import com.fas.data.repository.EnrollmentSessionRepository;
import com.fas.data.repository.KioskRepository;
import com.fas.data.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Adversarial Challenge Test Suite:
 * - Database Concurrency & Race Conditions
 * - Atomic Deactivation Logic & Zero Orphan Active Templates
 * - Multi-Template Query Return Contracts (Preventing NonUniqueResultException)
 * - Cryptographic Independence (AES-256-GCM distinct IVs and Auth Tags)
 */
@SpringBootTest
@ActiveProfiles("test")
class BiometricAdversarialChallengeTest {

    @Autowired
    private EnrollmentService enrollmentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BiometricTemplateRepository biometricTemplateRepository;

    @Autowired
    private EnrollmentSessionRepository enrollmentSessionRepository;

    @Autowired
    private KioskRepository kioskRepository;

    @Autowired
    private BiometricCryptoService biometricCryptoService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Kiosk activeKiosk;

    @BeforeEach
    void setUp() {
        try {
            jdbcTemplate.execute("ALTER TABLE biometric_templates ALTER COLUMN encrypted_vector SET DATA TYPE BYTEA");
        } catch (Exception ignored) {
            // If already altered or table created as BYTEA
        }
        if (!kioskRepository.existsById("KIOSK-ADV-01")) {
            activeKiosk = kioskRepository.save(Kiosk.builder()
                    .id("KIOSK-ADV-01")
                    .locationName("Trạm Kiosk Adversarial Test")
                    .secretTokenHash("$2a$12$dummysecrethash")
                    .isActive(true)
                    .build());
        } else {
            activeKiosk = kioskRepository.findById("KIOSK-ADV-01").orElseThrow();
        }
    }

    private User createTestUser(String empCode, String email) {
        return userRepository.save(User.builder()
                .employeeCode(empCode)
                .fullName("User " + empCode)
                .email(email)
                .passwordHash("$2a$12$dummyhashvalue")
                .role(Role.EMPLOYEE)
                .status(EmployeeStatus.PENDING_CONSENT)
                .department("Phòng Thử Thách")
                .build());
    }

    private List<Float> createValidNormalizedVector() {
        List<Float> vector = new ArrayList<>(512);
        double val = 1.0 / Math.sqrt(512.0);
        for (int i = 0; i < 512; i++) {
            vector.add((float) val);
        }
        return vector;
    }

    private List<Float> createDistinctNormalizedVector(float shift) {
        float[] raw = new float[512];
        double sumSq = 0.0;
        for (int i = 0; i < 512; i++) {
            raw[i] = (float) Math.sin((i + 1) * 0.1 + shift);
            sumSq += raw[i] * raw[i];
        }
        double norm = Math.sqrt(sumSq);
        List<Float> vec = new ArrayList<>(512);
        for (int i = 0; i < 512; i++) {
            vec.add((float) (raw[i] / norm));
        }
        return vec;
    }

    private record OtpAndSession(String otp, String sessionToken) {}

    private OtpAndSession generateOtpAndSessionToken(Long userId) {
        ConsentResult consent = enrollmentService.createConsentSession(
                userId,
                new ConsentRequest(true, "v1.0"),
                "127.0.0.1"
        );
        OtpVerificationResult verify = enrollmentService.verifyOtp(
                new KioskVerifyOtpRequest(consent.otp(), activeKiosk.getId())
        );
        return new OtpAndSession(consent.otp(), verify.sessionToken());
    }

    private List<PoseTemplateDto> create3PoseTemplates(List<Float> front, List<Float> left, List<Float> right) {
        return List.of(
                new PoseTemplateDto("FRONTAL", front),
                new PoseTemplateDto("LEFT_TILT", left),
                new PoseTemplateDto("RIGHT_TILT", right)
        );
    }

    @Nested
    @DisplayName("Challenge 1: Atomic Deactivation & Re-enrollment Logic")
    class AtomicDeactivationTests {

        @Test
        @DisplayName("Re-enrollment from legacy single-template deactivates old and leaves exactly 3 active templates")
        void testReenrollment_FromLegacySingleTemplate_AtomicallyDeactivatesOldTemplate() {
            User user = createTestUser("ADV-DEACT-01", "adv01@test.com");

            // 1. Manually insert 1 legacy active single template (poseType FRONTAL)
            BiometricCryptoService.EncryptedVector encLegacy = biometricCryptoService.encryptVector(
                    new float[512] // dummy valid length float array
            );
            biometricTemplateRepository.save(BiometricTemplate.builder()
                    .user(user)
                    .poseType(PoseType.FRONTAL)
                    .encryptedVector(encLegacy.cipherText())
                    .encryptionIv(encLegacy.iv())
                    .algorithm("ARCFACE_512D")
                    .version(1)
                    .isActive(true)
                    .build());

            List<BiometricTemplate> before = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(before).hasSize(1);
            Long oldTemplateId = before.get(0).getId();

            // 2. Perform full multi-template re-enrollment
            OtpAndSession session = generateOtpAndSessionToken(user.getId());
            List<PoseTemplateDto> templates = create3PoseTemplates(
                    createValidNormalizedVector(),
                    createDistinctNormalizedVector(1.0f),
                    createDistinctNormalizedVector(2.0f)
            );
            EnrollmentResult result = enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(),
                    session.sessionToken(),
                    activeKiosk.getId(),
                    templates
            ));

            assertThat(result.templateCount()).isEqualTo(3);
            assertThat(result.status()).isEqualTo(EmployeeStatus.ACTIVE);

            // 3. Verify database state
            List<BiometricTemplate> activeTemplates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(activeTemplates)
                    .as("Exactly 3 templates must be active after re-enrollment")
                    .hasSize(3);

            List<BiometricTemplate> allTemplates = biometricTemplateRepository.findByUserId(user.getId());
            assertThat(allTemplates)
                    .as("Total templates must be 4 (1 legacy deactivated + 3 new active)")
                    .hasSize(4);

            BiometricTemplate oldTemplate = biometricTemplateRepository.findById(oldTemplateId).orElseThrow();
            assertThat(oldTemplate.getIsActive())
                    .as("Old legacy template must be deactivated (isActive = false)")
                    .isFalse();

            // Ensure all 3 poses are present in active templates
            Set<PoseType> activePoses = new HashSet<>();
            for (BiometricTemplate t : activeTemplates) {
                assertThat(t.getIsActive()).isTrue();
                activePoses.add(t.getPoseType());
            }
            assertThat(activePoses).containsExactlyInAnyOrder(PoseType.FRONTAL, PoseType.LEFT_TILT, PoseType.RIGHT_TILT);
        }

        @Test
        @DisplayName("Re-enrollment from multi-template deactivates all 3 old templates without orphan active records")
        void testReenrollment_FromMultiTemplate_AtomicallyDeactivatesAll3OldTemplates() {
            User user = createTestUser("ADV-DEACT-02", "adv02@test.com");

            // 1. First enrollment (3 templates)
            OtpAndSession session1 = generateOtpAndSessionToken(user.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session1.otp(),
                    session1.sessionToken(),
                    activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.5f), createDistinctNormalizedVector(0.8f))
            ));

            List<BiometricTemplate> run1Active = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(run1Active).hasSize(3);
            Set<Long> run1Ids = new HashSet<>();
            for (BiometricTemplate t : run1Active) {
                run1Ids.add(t.getId());
            }

            // 2. Second enrollment (re-enrollment with 3 new templates)
            OtpAndSession session2 = generateOtpAndSessionToken(user.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session2.otp(),
                    session2.sessionToken(),
                    activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(1.5f), createDistinctNormalizedVector(2.5f))
            ));

            // 3. Verify DB integrity
            List<BiometricTemplate> run2Active = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(run2Active)
                    .as("Exactly 3 templates must be active after re-enrollment")
                    .hasSize(3);

            for (BiometricTemplate t : run2Active) {
                assertThat(run1Ids)
                        .as("Active template ID %d should NOT be in the old batch %s", t.getId(), run1Ids)
                        .doesNotContain(t.getId());
            }

            List<BiometricTemplate> allTemplates = biometricTemplateRepository.findByUserId(user.getId());
            assertThat(allTemplates).hasSize(6);

            long inactiveCount = allTemplates.stream().filter(t -> !t.getIsActive()).count();
            long activeCount = allTemplates.stream().filter(BiometricTemplate::getIsActive).count();

            assertThat(inactiveCount).as("All 3 previous templates must be inactive").isEqualTo(3);
            assertThat(activeCount).as("Exactly 3 new templates must be active").isEqualTo(3);
        }

        @Test
        @DisplayName("Stress Test: 5 consecutive re-enrollments leave zero orphan active records")
        void testRepeatedConsecutiveReenrollments_ZeroOrphanActiveTemplates() {
            User user = createTestUser("ADV-DEACT-03", "adv03@test.com");

            for (int round = 1; round <= 5; round++) {
                OtpAndSession session = generateOtpAndSessionToken(user.getId());
                enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                        session.otp(),
                        session.sessionToken(),
                        activeKiosk.getId(),
                        create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(round * 0.1f), createDistinctNormalizedVector(round * 0.2f))
                ));

                List<BiometricTemplate> active = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
                assertThat(active)
                        .as("Round %d must result in exactly 3 active templates", round)
                        .hasSize(3);

                List<BiometricTemplate> all = biometricTemplateRepository.findByUserId(user.getId());
                assertThat(all).hasSize(round * 3);
            }

            List<BiometricTemplate> finalAll = biometricTemplateRepository.findByUserId(user.getId());
            assertThat(finalAll).hasSize(15);

            long activeCount = finalAll.stream().filter(BiometricTemplate::getIsActive).count();
            long inactiveCount = finalAll.stream().filter(t -> !t.getIsActive()).count();

            assertThat(activeCount).as("Final active templates must be exactly 3").isEqualTo(3);
            assertThat(inactiveCount).as("Final inactive templates must be exactly 12").isEqualTo(12);
        }

        @Test
        @DisplayName("Cross-user isolation: deactivating User A templates does not affect User B")
        void testCrossUserIsolation_DeactivationAffectsOnlyTargetUser() {
            User userA = createTestUser("ADV-ISO-A", "isoA@test.com");
            User userB = createTestUser("ADV-ISO-B", "isoB@test.com");

            // Enroll User A
            OtpAndSession sessionA1 = generateOtpAndSessionToken(userA.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    sessionA1.otp(), sessionA1.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.1f), createDistinctNormalizedVector(0.2f))
            ));

            // Enroll User B
            OtpAndSession sessionB = generateOtpAndSessionToken(userB.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    sessionB.otp(), sessionB.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.3f), createDistinctNormalizedVector(0.4f))
            ));

            assertThat(biometricTemplateRepository.findByUserIdAndIsActiveTrue(userA.getId())).hasSize(3);
            assertThat(biometricTemplateRepository.findByUserIdAndIsActiveTrue(userB.getId())).hasSize(3);

            // Re-enroll User A
            OtpAndSession sessionA2 = generateOtpAndSessionToken(userA.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    sessionA2.otp(), sessionA2.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.5f), createDistinctNormalizedVector(0.6f))
            ));

            // Verify User B is completely untouched
            List<BiometricTemplate> userBActive = biometricTemplateRepository.findByUserIdAndIsActiveTrue(userB.getId());
            assertThat(userBActive)
                    .as("User B's 3 active templates must remain completely unaffected")
                    .hasSize(3);
            for (BiometricTemplate t : userBActive) {
                assertThat(t.getIsActive()).isTrue();
            }

            // Verify User A has 3 active and 3 inactive
            assertThat(biometricTemplateRepository.findByUserIdAndIsActiveTrue(userA.getId())).hasSize(3);
            assertThat(biometricTemplateRepository.findByUserId(userA.getId())).hasSize(6);
        }
    }

    @Nested
    @DisplayName("Challenge 2: Query Return Contracts & NonUniqueResultException Prevention")
    class QueryContractTests {

        @Test
        @DisplayName("findByUserIdAndIsActiveTrue returns List<BiometricTemplate> preventing NonUniqueResultException")
        void testFindByUserIdAndIsActiveTrue_ReturnsListWithoutException() {
            User user = createTestUser("ADV-QUERY-01", "query01@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.1f), createDistinctNormalizedVector(0.2f))
            ));

            // With 3 active templates, findByUserIdAndIsActiveTrue MUST return a List and not crash
            List<BiometricTemplate> result = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(result).isNotNull().hasSize(3);
        }

        @Test
        @DisplayName("findFirstByUserIdAndIsActiveTrue safely returns Optional without NonUniqueResultException")
        void testFindFirstByUserIdAndIsActiveTrue_ReturnsOptionalSafely() {
            User user = createTestUser("ADV-QUERY-02", "query02@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.1f), createDistinctNormalizedVector(0.2f))
            ));

            Optional<BiometricTemplate> firstOpt = biometricTemplateRepository.findFirstByUserIdAndIsActiveTrue(user.getId());
            assertThat(firstOpt).isPresent();
            assertThat(firstOpt.get().getIsActive()).isTrue();
        }

        @Test
        @DisplayName("findByUserIdAndPoseTypeAndIsActiveTrue returns distinct single template per pose")
        void testFindByUserIdAndPoseTypeAndIsActiveTrue_ReturnsUniquePerPose() {
            User user = createTestUser("ADV-QUERY-03", "query03@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(createValidNormalizedVector(), createDistinctNormalizedVector(0.1f), createDistinctNormalizedVector(0.2f))
            ));

            Optional<BiometricTemplate> frontalOpt = biometricTemplateRepository.findByUserIdAndPoseTypeAndIsActiveTrue(user.getId(), PoseType.FRONTAL);
            Optional<BiometricTemplate> leftOpt = biometricTemplateRepository.findByUserIdAndPoseTypeAndIsActiveTrue(user.getId(), PoseType.LEFT_TILT);
            Optional<BiometricTemplate> rightOpt = biometricTemplateRepository.findByUserIdAndPoseTypeAndIsActiveTrue(user.getId(), PoseType.RIGHT_TILT);

            assertThat(frontalOpt).isPresent();
            assertThat(leftOpt).isPresent();
            assertThat(rightOpt).isPresent();

            assertThat(frontalOpt.get().getId()).isNotEqualTo(leftOpt.get().getId());
            assertThat(leftOpt.get().getId()).isNotEqualTo(rightOpt.get().getId());
            assertThat(frontalOpt.get().getId()).isNotEqualTo(rightOpt.get().getId());
        }

        @Test
        @DisplayName("Adversarial: Artificially duplicated active poses throw in single-result query but NOT in List query")
        void testAdversarialDuplicatePose_ContrastListVsSingleResult() {
            User user = createTestUser("ADV-QUERY-04", "query04@test.com");

            // Artificially insert 2 active templates for FRONTAL
            BiometricCryptoService.EncryptedVector enc1 = biometricCryptoService.encryptVector(new float[512]);
            BiometricCryptoService.EncryptedVector enc2 = biometricCryptoService.encryptVector(new float[512]);

            biometricTemplateRepository.save(BiometricTemplate.builder()
                    .user(user).poseType(PoseType.FRONTAL).encryptedVector(enc1.cipherText())
                    .encryptionIv(enc1.iv()).algorithm("ARCFACE_512D").version(1).isActive(true).build());
            biometricTemplateRepository.save(BiometricTemplate.builder()
                    .user(user).poseType(PoseType.FRONTAL).encryptedVector(enc2.cipherText())
                    .encryptionIv(enc2.iv()).algorithm("ARCFACE_512D").version(1).isActive(true).build());

            // 1. List query handles duplicates gracefully without throwing
            List<BiometricTemplate> list = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(list).hasSize(2);

            // 2. Contrast: Single-result query on duplicate pose MUST throw IncorrectResultSizeDataAccessException
            assertThatThrownBy(() -> biometricTemplateRepository.findByUserIdAndPoseTypeAndIsActiveTrue(user.getId(), PoseType.FRONTAL))
                    .isInstanceOf(IncorrectResultSizeDataAccessException.class);
        }
    }

    @Nested
    @DisplayName("Challenge 3: Cryptographic Independence (Distinct IVs and Auth Tags)")
    class CryptographicIndependenceTests {

        @Test
        @DisplayName("3 templates stored for a user have pairwise distinct IVs and Auth Tags")
        void test3Templates_StoredForUser_HaveDistinctIvsAndDistinctAuthTags() {
            User user = createTestUser("ADV-CRYPTO-01", "crypto01@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());

            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(
                            createValidNormalizedVector(),
                            createDistinctNormalizedVector(0.3f),
                            createDistinctNormalizedVector(0.7f)
                    )
            ));

            List<BiometricTemplate> templates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(templates).hasSize(3);

            BiometricTemplate tFront = templates.stream().filter(t -> t.getPoseType() == PoseType.FRONTAL).findFirst().orElseThrow();
            BiometricTemplate tLeft = templates.stream().filter(t -> t.getPoseType() == PoseType.LEFT_TILT).findFirst().orElseThrow();
            BiometricTemplate tRight = templates.stream().filter(t -> t.getPoseType() == PoseType.RIGHT_TILT).findFirst().orElseThrow();

            // 1. Verify IV lengths and pairwise distinctness
            assertThat(tFront.getEncryptionIv()).hasSize(12);
            assertThat(tLeft.getEncryptionIv()).hasSize(12);
            assertThat(tRight.getEncryptionIv()).hasSize(12);

            assertThat(tFront.getEncryptionIv()).isNotEqualTo(tLeft.getEncryptionIv());
            assertThat(tLeft.getEncryptionIv()).isNotEqualTo(tRight.getEncryptionIv());
            assertThat(tFront.getEncryptionIv()).isNotEqualTo(tRight.getEncryptionIv());

            // 2. Verify Ciphertext lengths (512 * 4 = 2048 + 16 auth tag = 2064 bytes)
            final int expectedLength = 512 * Float.BYTES + 16;
            assertThat(tFront.getEncryptedVector()).hasSize(expectedLength);
            assertThat(tLeft.getEncryptedVector()).hasSize(expectedLength);
            assertThat(tRight.getEncryptedVector()).hasSize(expectedLength);

            // 3. Extract and verify Auth Tags (last 16 bytes of encryptedVector)
            byte[] tagFront = Arrays.copyOfRange(tFront.getEncryptedVector(), 2048, 2064);
            byte[] tagLeft = Arrays.copyOfRange(tLeft.getEncryptedVector(), 2048, 2064);
            byte[] tagRight = Arrays.copyOfRange(tRight.getEncryptedVector(), 2048, 2064);

            assertThat(tagFront).hasSize(16);
            assertThat(tagLeft).hasSize(16);
            assertThat(tagRight).hasSize(16);

            assertThat(tagFront).isNotEqualTo(tagLeft);
            assertThat(tagLeft).isNotEqualTo(tagRight);
            assertThat(tagFront).isNotEqualTo(tagRight);

            // 4. Extract and verify Ciphertext body (first 2048 bytes)
            byte[] ctFront = Arrays.copyOfRange(tFront.getEncryptedVector(), 0, 2048);
            byte[] ctLeft = Arrays.copyOfRange(tLeft.getEncryptedVector(), 0, 2048);
            byte[] ctRight = Arrays.copyOfRange(tRight.getEncryptedVector(), 0, 2048);

            assertThat(ctFront).isNotEqualTo(ctLeft);
            assertThat(ctLeft).isNotEqualTo(ctRight);
            assertThat(ctFront).isNotEqualTo(ctRight);
        }

        @Test
        @DisplayName("Cross-template decryption attack: Swapping IVs between templates fails with AEADBadTagException")
        void testCrossTemplateDecryptionAttack_SwappingIvs_AlwaysFails() {
            User user = createTestUser("ADV-CRYPTO-02", "crypto02@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());

            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(
                            createValidNormalizedVector(),
                            createDistinctNormalizedVector(0.2f),
                            createDistinctNormalizedVector(0.4f)
                    )
            ));

            List<BiometricTemplate> templates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            BiometricTemplate tA = templates.get(0);
            BiometricTemplate tB = templates.get(1);
            BiometricTemplate tC = templates.get(2);

            // Decrypting with correct IVs succeeds
            assertThat(biometricCryptoService.decryptVector(tA.getEncryptedVector(), tA.getEncryptionIv())).hasSize(512);
            assertThat(biometricCryptoService.decryptVector(tB.getEncryptedVector(), tB.getEncryptionIv())).hasSize(512);
            assertThat(biometricCryptoService.decryptVector(tC.getEncryptedVector(), tC.getEncryptionIv())).hasSize(512);

            // Swapping IVs must throw IllegalStateException ("không toàn vẹn hoặc sai khoá giải mã")
            assertThatThrownBy(() -> biometricCryptoService.decryptVector(tA.getEncryptedVector(), tB.getEncryptionIv()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("không toàn vẹn");

            assertThatThrownBy(() -> biometricCryptoService.decryptVector(tB.getEncryptedVector(), tC.getEncryptionIv()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("không toàn vẹn");

            assertThatThrownBy(() -> biometricCryptoService.decryptVector(tC.getEncryptedVector(), tA.getEncryptionIv()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("không toàn vẹn");
        }

        @Test
        @DisplayName("Adversarial: Identical input vectors for all 3 poses still yield distinct IVs, ciphertexts, and tags")
        void testIdenticalInputVectors_StillYieldDistinctIvsCiphertextsAndTags() {
            User user = createTestUser("ADV-CRYPTO-03", "crypto03@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());

            // Pass the exact same vector for all 3 poses
            List<Float> identicalVector = createValidNormalizedVector();
            enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                    session.otp(), session.sessionToken(), activeKiosk.getId(),
                    create3PoseTemplates(identicalVector, identicalVector, identicalVector)
            ));

            List<BiometricTemplate> templates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(templates).hasSize(3);

            byte[] iv0 = templates.get(0).getEncryptionIv();
            byte[] iv1 = templates.get(1).getEncryptionIv();
            byte[] iv2 = templates.get(2).getEncryptionIv();

            assertThat(iv0).isNotEqualTo(iv1);
            assertThat(iv1).isNotEqualTo(iv2);
            assertThat(iv0).isNotEqualTo(iv2);

            byte[] tag0 = Arrays.copyOfRange(templates.get(0).getEncryptedVector(), 2048, 2064);
            byte[] tag1 = Arrays.copyOfRange(templates.get(1).getEncryptedVector(), 2048, 2064);
            byte[] tag2 = Arrays.copyOfRange(templates.get(2).getEncryptedVector(), 2048, 2064);

            assertThat(tag0).isNotEqualTo(tag1);
            assertThat(tag1).isNotEqualTo(tag2);
            assertThat(tag0).isNotEqualTo(tag2);

            byte[] ct0 = Arrays.copyOfRange(templates.get(0).getEncryptedVector(), 0, 2048);
            byte[] ct1 = Arrays.copyOfRange(templates.get(1).getEncryptedVector(), 0, 2048);
            byte[] ct2 = Arrays.copyOfRange(templates.get(2).getEncryptedVector(), 0, 2048);

            assertThat(ct0).isNotEqualTo(ct1);
            assertThat(ct1).isNotEqualTo(ct2);
            assertThat(ct0).isNotEqualTo(ct2);
        }

        @Test
        @DisplayName("Statistical IV Entropy Stress: 200 consecutive encryptions have zero IV collisions and zero tag collisions")
        void testIvEntropyStress_200ConsecutiveEncryptions_ZeroCollisions() {
            float[] sample = new float[512];
            sample[0] = 1.0f;

            Set<String> ivSet = new HashSet<>(200);
            Set<String> tagSet = new HashSet<>(200);

            for (int i = 0; i < 200; i++) {
                BiometricCryptoService.EncryptedVector enc = biometricCryptoService.encryptVector(sample);
                String ivHex = HexFormat.of().formatHex(enc.iv());
                String tagHex = HexFormat.of().formatHex(Arrays.copyOfRange(enc.cipherText(), 2048, 2064));

                boolean ivAdded = ivSet.add(ivHex);
                boolean tagAdded = tagSet.add(tagHex);

                assertThat(ivAdded).as("IV collision detected at iteration %d", i).isTrue();
                assertThat(tagAdded).as("Auth tag collision detected at iteration %d", i).isTrue();
            }

            assertThat(ivSet).hasSize(200);
            assertThat(tagSet).hasSize(200);
        }
    }

    @Nested
    @DisplayName("Challenge 4: Database Concurrency & Race Conditions")
    class ConcurrencyTests {

        @Test
        @DisplayName("Concurrent enrollment with same session token: at most one thread succeeds and no orphan active templates")
        void testConcurrentEnrollment_SameSessionToken_NeverLeavesInconsistentTemplates() throws Exception {
            User user = createTestUser("ADV-CONCUR-01", "concur01@test.com");
            OtpAndSession session = generateOtpAndSessionToken(user.getId());

            int concurrency = 4;
            ExecutorService executor = Executors.newFixedThreadPool(concurrency);
            CountDownLatch readyLatch = new CountDownLatch(concurrency);
            CountDownLatch startLatch = new CountDownLatch(1);

            List<Future<Boolean>> futures = new ArrayList<>();

            for (int i = 0; i < concurrency; i++) {
                final int idx = i;
                futures.add(executor.submit(() -> {
                    readyLatch.countDown();
                    startLatch.await();
                    try {
                        enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                                session.otp(),
                                session.sessionToken(),
                                activeKiosk.getId(),
                                create3PoseTemplates(
                                        createValidNormalizedVector(),
                                        createDistinctNormalizedVector(idx * 0.1f),
                                        createDistinctNormalizedVector(idx * 0.2f)
                                )
                        ));
                        return true;
                    } catch (ApiException ex) {
                        return false;
                    }
                }));
            }

            readyLatch.await(5, TimeUnit.SECONDS);
            startLatch.countDown();

            int successCount = 0;
            int failureCount = 0;
            for (Future<Boolean> f : futures) {
                if (f.get(10, TimeUnit.SECONDS)) {
                    successCount++;
                } else {
                    failureCount++;
                }
            }
            executor.shutdown();

            assertThat(successCount)
                    .as("Exactly 1 concurrent request should succeed with the same OTP/session token")
                    .isEqualTo(1);
            assertThat(failureCount)
                    .as("The other concurrent requests must fail")
                    .isEqualTo(concurrency - 1);

            // Crucial database assertion: Active templates MUST be exactly 3, NEVER 6, 9, or 12
            List<BiometricTemplate> activeTemplates = biometricTemplateRepository.findByUserIdAndIsActiveTrue(user.getId());
            assertThat(activeTemplates)
                    .as("Active templates in DB must be exactly 3, preventing race condition duplicates")
                    .hasSize(3);
        }

        @Test
        @DisplayName("Concurrent enrollment for 4 distinct users: all succeed without cross-user interference")
        void testConcurrentEnrollment_DistinctUsers_AllSucceedIndependently() throws Exception {
            int userCount = 4;
            List<User> users = new ArrayList<>();
            List<OtpAndSession> sessions = new ArrayList<>();

            for (int i = 0; i < userCount; i++) {
                User u = createTestUser("ADV-MULTI-" + i, "multi" + i + "@test.com");
                users.add(u);
                sessions.add(generateOtpAndSessionToken(u.getId()));
            }

            ExecutorService executor = Executors.newFixedThreadPool(userCount);
            CountDownLatch startLatch = new CountDownLatch(1);
            List<Future<EnrollmentResult>> futures = new ArrayList<>();

            for (int i = 0; i < userCount; i++) {
                final int idx = i;
                futures.add(executor.submit(() -> {
                    startLatch.await();
                    return enrollmentService.enrollFace(new KioskEnrollFaceRequest(
                            sessions.get(idx).otp(),
                            sessions.get(idx).sessionToken(),
                            activeKiosk.getId(),
                            create3PoseTemplates(
                                    createValidNormalizedVector(),
                                    createDistinctNormalizedVector(idx * 0.5f),
                                    createDistinctNormalizedVector(idx * 0.9f)
                            )
                    ));
                }));
            }

            startLatch.countDown();

            for (Future<EnrollmentResult> f : futures) {
                EnrollmentResult res = f.get(10, TimeUnit.SECONDS);
                assertThat(res).isNotNull();
                assertThat(res.templateCount()).isEqualTo(3);
            }
            executor.shutdown();

            // Verify each user has exactly 3 active templates
            Set<String> allIvs = new HashSet<>();
            for (User u : users) {
                List<BiometricTemplate> active = biometricTemplateRepository.findByUserIdAndIsActiveTrue(u.getId());
                assertThat(active).hasSize(3);
                for (BiometricTemplate t : active) {
                    allIvs.add(HexFormat.of().formatHex(t.getEncryptionIv()));
                }
            }

            // Verify all 12 templates across all 4 users have distinct IVs
            assertThat(allIvs).as("All 12 templates across 4 users must have distinct IVs").hasSize(12);
        }
    }

    @Nested
    @DisplayName("Challenge 5: Entity Mapping & Schema Boundary")
    class EntityMappingTests {

        @Test
        @DisplayName("BiometricTemplate.encryptedVector must specify columnDefinition BYTEA to support 2064-byte vectors")
        void testEncryptedVector_ColumnDefinitionShouldSupport2064Bytes() throws Exception {
            jakarta.persistence.Column col = BiometricTemplate.class
                    .getDeclaredField("encryptedVector")
                    .getAnnotation(jakarta.persistence.Column.class);

            assertThat(col).isNotNull();
            assertThat(col.columnDefinition())
                    .as("BiometricTemplate.encryptedVector must specify columnDefinition='BYTEA' to prevent H2/Hibernate defaulting to BINARY VARYING(255)")
                    .isEqualToIgnoringCase("BYTEA");
        }
    }
}
