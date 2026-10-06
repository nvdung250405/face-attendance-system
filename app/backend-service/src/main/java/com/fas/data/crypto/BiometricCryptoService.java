package com.fas.data.crypto;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Dịch vụ Mã hóa Sinh trắc học (SOL-BE-004, BLD-BE-010, DD-BE-004).
 *
 * <p>Mã hóa/giải mã vector ArcFace 512D bằng AES-256-GCM: IV ngẫu nhiên 12 byte sinh mới cho mỗi lần
 * mã hóa, Auth Tag 128-bit do JCE gắn vào cuối ciphertext. Cột {@code encryption_iv} lưu IV riêng và
 * cột {@code encrypted_vector} lưu {@code ciphertext || tag} theo thực thể {@code biometric_templates}.
 */
@Component
public class BiometricCryptoService {

    /** Số chiều vector ArcFace theo DATA-SYS-010. */
    public static final int VECTOR_DIMENSION = 512;

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int TAG_LENGTH_BYTES = TAG_LENGTH_BITS / 8;
    private static final int KEY_LENGTH_BYTES = 32;
    private static final int VECTOR_LENGTH_BYTES = VECTOR_DIMENSION * Float.BYTES;

    private final SecretKeySpec masterKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public BiometricCryptoService(@Value("${fas.security.encryption-master-key}") String masterKeyHex) {
        this.masterKey = new SecretKeySpec(parseMasterKey(masterKeyHex), "AES");
    }

    /**
     * Mã hóa một vector đặc trưng thành {@code ciphertext || tag} kèm IV mới.
     *
     * @param vector vector 512D (đã chuẩn hóa L2 ở tầng hợp đồng API bởi {@code @L2Normalized})
     * @return payload gồm ciphertext (kèm Auth Tag) và IV 12 byte
     */
    public EncryptedVector encryptVector(float[] vector) {
        requireValidVector(vector);
        byte[] iv = new byte[IV_LENGTH_BYTES];
        secureRandom.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new EncryptedVector(cipher.doFinal(toBytes(vector)), iv);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Không mã hóa được vector sinh trắc học", ex);
        }
    }

    /**
     * Giải mã vector đã lưu trong CSDL.
     *
     * @param cipherTextWithTag giá trị cột {@code encrypted_vector} (ciphertext kèm Auth Tag 16 byte)
     * @param iv                giá trị cột {@code encryption_iv} (đúng 12 byte)
     * @return vector 512D khôi phục nguyên vẹn
     * @throws IllegalStateException khi dữ liệu bị sửa đổi, sai khoá hoặc sai định dạng khối
     */
    public float[] decryptVector(byte[] cipherTextWithTag, byte[] iv) {
        requireValidCipherText(cipherTextWithTag);
        requireValidIv(iv);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return toFloats(cipher.doFinal(cipherTextWithTag));
        } catch (AEADBadTagException ex) {
            throw new IllegalStateException("Vector sinh trắc học không toàn vẹn hoặc sai khoá giải mã", ex);
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Không giải mã được vector sinh trắc học", ex);
        }
    }

    /** Kết quả mã hóa: ciphertext kèm Auth Tag và IV tương ứng. */
    public record EncryptedVector(byte[] cipherText, byte[] iv) {
    }

    private static byte[] parseMasterKey(String masterKeyHex) {
        if (masterKeyHex == null || masterKeyHex.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình fas.security.encryption-master-key");
        }
        String normalized = masterKeyHex.trim();
        if (normalized.length() != KEY_LENGTH_BYTES * 2) {
            throw new IllegalStateException(
                    "ENCRYPTION_MASTER_KEY phải là 64 ký tự hex tương ứng 32 byte khoá AES-256");
        }
        try {
            return HexFormat.of().parseHex(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("ENCRYPTION_MASTER_KEY không phải chuỗi hex hợp lệ", ex);
        }
    }

    private static void requireValidVector(float[] vector) {
        if (vector == null) {
            throw new IllegalArgumentException("Vector sinh trắc học không được rỗng");
        }
        if (vector.length != VECTOR_DIMENSION) {
            throw new IllegalArgumentException(
                    "Vector ArcFace phải đúng " + VECTOR_DIMENSION + " chiều (DATA-SYS-010)");
        }
        for (float value : vector) {
            if (!Float.isFinite(value)) {
                throw new IllegalArgumentException("Vector sinh trắc học chứa giá trị không hợp lệ (NaN/Infinity)");
            }
        }
    }

    private static void requireValidCipherText(byte[] cipherTextWithTag) {
        if (cipherTextWithTag == null) {
            throw new IllegalArgumentException("Ciphertext sinh trắc học không được rỗng");
        }
        if (cipherTextWithTag.length != VECTOR_LENGTH_BYTES + TAG_LENGTH_BYTES) {
            throw new IllegalArgumentException("Ciphertext phải dài đúng "
                    + (VECTOR_LENGTH_BYTES + TAG_LENGTH_BYTES) + " byte (512 float32 + Auth Tag 16 byte)");
        }
    }

    private static void requireValidIv(byte[] iv) {
        if (iv == null || iv.length != IV_LENGTH_BYTES) {
            throw new IllegalArgumentException("IV phải đúng " + IV_LENGTH_BYTES + " byte (DD-BE-004)");
        }
    }

    private static byte[] toBytes(float[] vector) {
        ByteBuffer buffer = ByteBuffer.allocate(VECTOR_LENGTH_BYTES).order(ByteOrder.BIG_ENDIAN);
        for (float value : vector) {
            buffer.putFloat(value);
        }
        return buffer.array();
    }

    private static float[] toFloats(byte[] bytes) {
        ByteBuffer buffer = ByteBuffer.wrap(bytes).order(ByteOrder.BIG_ENDIAN);
        float[] vector = new float[VECTOR_DIMENSION];
        for (int index = 0; index < VECTOR_DIMENSION; index++) {
            vector[index] = buffer.getFloat();
        }
        return vector;
    }
}
