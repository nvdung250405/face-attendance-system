package com.fas.data.crypto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TST-BE-012: Kiểm thử Mã hóa & Giải mã Vector AES-256-GCM.
 * Covers: FR-BE-004, FR-BE-006, NFR-BE-003. Realizes: SOL-BE-004, DATA-BE-015, DTD-BE-005.
 */
class BiometricCryptoServiceTest {

    private static final String MASTER_KEY_HEX =
            "9f8e7d6c5b4a3a2b1c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b";
    private static final String OTHER_KEY_HEX =
            "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0";
    private static final int EXPECTED_CIPHER_TEXT_BYTES = 512 * Float.BYTES + 16;

    private final BiometricCryptoService service = new BiometricCryptoService(MASTER_KEY_HEX);

    @Test
    @DisplayName("TST-BE-012: Mã hóa rồi giải mã bảo toàn 100% giá trị vector 512D")
    void roundTripPreservesEveryComponent() {
        float[] original = normalizedVector();

        BiometricCryptoService.EncryptedVector payload = service.encryptVector(original);
        float[] restored = service.decryptVector(payload.cipherText(), payload.iv());

        assertThat(restored).hasSize(BiometricCryptoService.VECTOR_DIMENSION);
        assertThat(restored).isEqualTo(original);
    }

    @Test
    @DisplayName("TST-BE-012: Mỗi lần mã hóa sinh IV 12 byte mới và ciphertext khác nhau")
    void everyEncryptionUsesFreshIv() {
        float[] vector = normalizedVector();

        BiometricCryptoService.EncryptedVector first = service.encryptVector(vector);
        BiometricCryptoService.EncryptedVector second = service.encryptVector(vector);

        assertThat(first.iv()).hasSize(12);
        assertThat(second.iv()).hasSize(12);
        assertThat(first.iv()).isNotEqualTo(second.iv());
        assertThat(first.cipherText()).isNotEqualTo(second.cipherText());
    }

    @Test
    @DisplayName("TST-BE-012: Ciphertext dài đúng 512 float32 kèm Auth Tag 16 byte và không chứa plaintext")
    void cipherTextCarriesTagAndNoPlainText() {
        float[] vector = normalizedVector();
        byte[] plainText = new byte[512 * Float.BYTES];
        java.nio.ByteBuffer.wrap(plainText).asFloatBuffer().put(vector);

        BiometricCryptoService.EncryptedVector payload = service.encryptVector(vector);

        assertThat(payload.cipherText()).hasSize(EXPECTED_CIPHER_TEXT_BYTES);
        assertThat(payload.cipherText()).isNotEqualTo(plainText);
        assertThat(indexOf(payload.cipherText(), Arrays.copyOf(plainText, 64))).isEqualTo(-1);
    }

    @Test
    @DisplayName("TST-BE-012: Dữ liệu bị sửa đổi bị từ chối (Auth Tag không khớp)")
    void tamperedCipherTextIsRejected() {
        BiometricCryptoService.EncryptedVector payload = service.encryptVector(normalizedVector());
        byte[] tampered = payload.cipherText().clone();
        tampered[100] ^= 0x01;

        assertThatThrownBy(() -> service.decryptVector(tampered, payload.iv()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("không toàn vẹn");
    }

    @Test
    @DisplayName("TST-BE-012: IV bị sửa đổi bị từ chối")
    void tamperedIvIsRejected() {
        BiometricCryptoService.EncryptedVector payload = service.encryptVector(normalizedVector());
        byte[] tamperedIv = payload.iv().clone();
        tamperedIv[0] ^= 0x01;

        assertThatThrownBy(() -> service.decryptVector(payload.cipherText(), tamperedIv))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("TST-BE-012: Sai khoá chủ không giải mã được (NFR-BE-003)")
    void wrongMasterKeyCannotDecrypt() {
        BiometricCryptoService.EncryptedVector payload = service.encryptVector(normalizedVector());
        BiometricCryptoService otherService = new BiometricCryptoService(OTHER_KEY_HEX);

        assertThatThrownBy(() -> otherService.decryptVector(payload.cipherText(), payload.iv()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("TST-BE-012: Từ chối vector sai số chiều hoặc chứa NaN")
    void rejectsInvalidVector() {
        assertThatThrownBy(() -> service.encryptVector(new float[256]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("512 chiều");

        float[] withNaN = normalizedVector();
        withNaN[7] = Float.NaN;
        assertThatThrownBy(() -> service.encryptVector(withNaN))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    @DisplayName("TST-BE-012: Từ chối khoá chủ sai định dạng (không phải 32 byte hex)")
    void rejectsInvalidMasterKey() {
        assertThatThrownBy(() -> new BiometricCryptoService("abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("64 ký tự hex");

        assertThatThrownBy(() -> new BiometricCryptoService("z".repeat(64)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("hex hợp lệ");

        assertThatThrownBy(() -> new BiometricCryptoService("  "))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Thiếu cấu hình");
    }

    @Test
    @DisplayName("TST-BE-012: Từ chối ciphertext hoặc IV sai kích thước")
    void rejectsMalformedPayload() {
        BiometricCryptoService.EncryptedVector payload = service.encryptVector(normalizedVector());

        assertThatThrownBy(() -> service.decryptVector(new byte[16], payload.iv()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ciphertext");

        assertThatThrownBy(() -> service.decryptVector(payload.cipherText(), new byte[8]))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("IV");
    }

    /** Vector 512D chuẩn hóa L2 = 1.0 giống dữ liệu ArcFace thực tế. */
    private static float[] normalizedVector() {
        float[] vector = new float[BiometricCryptoService.VECTOR_DIMENSION];
        double sumOfSquares = 0.0;
        for (int index = 0; index < vector.length; index++) {
            vector[index] = (float) Math.sin(index * 0.37);
            sumOfSquares += (double) vector[index] * vector[index];
        }
        double norm = Math.sqrt(sumOfSquares);
        for (int index = 0; index < vector.length; index++) {
            vector[index] = (float) (vector[index] / norm);
        }
        return vector;
    }

    private static int indexOf(byte[] haystack, byte[] needle) {
        outer:
        for (int start = 0; start <= haystack.length - needle.length; start++) {
            for (int offset = 0; offset < needle.length; offset++) {
                if (haystack[start + offset] != needle[offset]) {
                    continue outer;
                }
            }
            return start;
        }
        return -1;
    }
}
