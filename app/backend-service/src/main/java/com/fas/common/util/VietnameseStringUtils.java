package com.fas.common.util;

import java.text.Normalizer;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.regex.Pattern;

/**
 * Tiện ích xử lý chuỗi tiếng Việt và bóc tách slug ngữ nghĩa.
 * Đồng nhất 1:1 với client-side utility trong codePreview.ts.
 */
public final class VietnameseStringUtils {

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern CA_WORD_PATTERN = Pattern.compile("(?i)\\bca\\b");
    private static final Pattern PHONG_BAN_PATTERN = Pattern.compile("(?i)\\b(?:phong|ban)\\b");
    private static final Pattern NON_ALPHANUM_SPACE_PATTERN = Pattern.compile("[^a-z0-9\\s]");
    private static final Pattern NON_ALPHA_SPACE_PATTERN = Pattern.compile("[^a-z\\s]");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    private VietnameseStringUtils() {
    }

    /**
     * Loại bỏ toàn bộ dấu thanh và dấu phụ tiếng Việt.
     *
     * @param text chuỗi nguồn
     * @return chuỗi đã xóa dấu thanh và dấu phụ (null trả về chuỗi rỗng)
     */
    public static String removeDiacritics(String text) {
        if (text == null) {
            return "";
        }
        String normalized = text.replace('đ', 'd').replace('Đ', 'D');
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(normalized).replaceAll("");
    }

    /**
     * Bóc tách slug ngữ nghĩa ca làm việc từ tên ca.
     *
     * @param name tên ca làm việc
     * @return slug ngắn gọn (ví dụ: HC, SANG, CHIEU, DEM, GAY, PT, CA)
     */
    public static String extractShiftSlug(String name) {
        if (name == null || name.isBlank()) {
            return "CA";
        }
        String normalized = removeDiacritics(name.trim()).toLowerCase();

        if (normalized.contains("hanh chinh") || normalized.matches(".*\\bhc\\b.*")) {
            return "HC";
        }
        if (normalized.contains("sang")) {
            return "SANG";
        }
        if (normalized.contains("chieu")) {
            return "CHIEU";
        }
        if (normalized.contains("dem")) {
            return "DEM";
        }
        if (normalized.contains("toi")) {
            return "TOI";
        }
        if (normalized.contains("gay")) {
            return "GAY";
        }
        if (normalized.contains("part-time")
                || normalized.contains("part time")
                || normalized.contains("ban thoi gian")
                || normalized.matches(".*\\bpt\\b.*")) {
            return "PT";
        }

        // Fallback: Lấy chữ cái đầu của các từ sau khi bỏ từ "ca" hoặc lấy tối đa 5 ký tự đầu
        String cleaned = CA_WORD_PATTERN.matcher(normalized).replaceAll("").trim();
        String[] words = Arrays.stream(MULTI_SPACE_PATTERN.split(cleaned))
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);

        if (words.length > 1) {
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) {
                    sb.append(Character.toUpperCase(w.charAt(0)));
                }
            }
            return sb.length() > 5 ? sb.substring(0, 5) : sb.toString();
        }
        if (words.length == 1 && !words[0].isEmpty()) {
            String single = words[0].toUpperCase();
            return single.length() > 5 ? single.substring(0, 5) : single;
        }

        return "CA";
    }

    /**
     * Bóc tách slug thời gian từ giờ bắt đầu và kết thúc ca làm việc.
     *
     * @param startTime giờ bắt đầu
     * @param endTime   giờ kết thúc
     * @return slug dạng HHmmHHmm hoặc HHHH (khi số phút đều là 00)
     */
    public static String extractTimeSlug(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            return "0000";
        }
        int sH = startTime.getHour();
        int sM = startTime.getMinute();
        int eH = endTime.getHour();
        int eM = endTime.getMinute();

        if (sM == 0 && eM == 0) {
            return String.format("%02d%02d", sH, eH);
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("%02d", sH));
        if (sM != 0) {
            sb.append(String.format("%02d", sM));
        }
        sb.append(String.format("%02d", eH));
        if (eM != 0) {
            sb.append(String.format("%02d", eM));
        }
        return sb.toString();
    }

    /**
     * Bóc tách slug ngữ nghĩa địa điểm từ tên vị trí trạm Kiosk.
     *
     * @param location tên vị trí lắp đặt
     * @return slug địa điểm (ví dụ: HN, HCM, DN, BN, HP, CT, BD, DNA, KHO, GEN)
     */
    public static String extractLocationSlug(String location) {
        if (location == null || location.isBlank()) {
            return "GEN";
        }
        String normalized = removeDiacritics(location.trim()).toLowerCase();

        if (normalized.contains("ha noi") || normalized.matches(".*\\bhn\\b.*")) {
            return "HN";
        }
        if (normalized.contains("ho chi minh")
                || normalized.contains("tp.hcm")
                || normalized.contains("tphcm")
                || normalized.contains("tp hcm")
                || normalized.contains("sai gon")
                || normalized.matches(".*\\bhcm\\b.*")) {
            return "HCM";
        }
        if (normalized.contains("da nang") || normalized.matches(".*\\bdn\\b.*")) {
            return "DN";
        }
        if (normalized.contains("bac ninh") || normalized.matches(".*\\bbn\\b.*")) {
            return "BN";
        }
        if (normalized.contains("hai phong") || normalized.matches(".*\\bhp\\b.*")) {
            return "HP";
        }
        if (normalized.contains("can tho") || normalized.matches(".*\\bct\\b.*")) {
            return "CT";
        }
        if (normalized.contains("binh duong") || normalized.matches(".*\\bbd\\b.*")) {
            return "BD";
        }
        if (normalized.contains("dong nai") || normalized.matches(".*\\bdni\\b.*")) {
            return "DNA";
        }
        if (normalized.contains("kho")) {
            return "KHO";
        }

        // Fallback: Bóc tách từ đầu hoặc viết tắt (chỉ lấy chữ cái, bỏ số và ký tự lạ)
        String cleaned = NON_ALPHA_SPACE_PATTERN.matcher(normalized).replaceAll(" ").trim();
        String[] words = Arrays.stream(MULTI_SPACE_PATTERN.split(cleaned))
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);

        if (words.length > 1) {
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) {
                    sb.append(Character.toUpperCase(w.charAt(0)));
                }
            }
            return sb.length() > 4 ? sb.substring(0, 4) : sb.toString();
        }
        if (words.length == 1 && words[0].length() >= 2) {
            String single = words[0].toUpperCase();
            return single.length() > 4 ? single.substring(0, 4) : single;
        }

        return "GEN";
    }

    /**
     * Bóc tách slug ngữ nghĩa phòng ban từ tên bộ phận.
     *
     * @param department tên phòng ban
     * @return slug phòng ban (ví dụ: ENG, HR, SAL, ACC, LOG, IT, SEC, BOD, RD, GEN)
     */
    public static String extractDepartmentSlug(String department) {
        if (department == null || department.isBlank()) {
            return "GEN";
        }
        String normalized = removeDiacritics(department.trim()).toLowerCase();

        if (normalized.contains("ky thuat")
                || normalized.contains("engineering")
                || normalized.matches(".*\\beng\\b.*")
                || normalized.contains("tich hop")) {
            return "ENG";
        }
        if (normalized.contains("nhan su")
                || normalized.matches(".*\\bhr\\b.*")
                || normalized.contains("dao tao")) {
            return "HR";
        }
        if (normalized.contains("kinh doanh")
                || normalized.contains("sales")
                || normalized.matches(".*\\bsal\\b.*")
                || normalized.contains("khach hang")) {
            return "SAL";
        }
        if (normalized.contains("ke toan")
                || normalized.contains("tai chinh")
                || normalized.contains("accounting")
                || normalized.matches(".*\\bacc\\b.*")) {
            return "ACC";
        }
        if (normalized.contains("kho van")
                || normalized.contains("logistics")
                || normalized.matches(".*\\blog\\b.*")
                || normalized.contains("kho")) {
            return "LOG";
        }
        if (normalized.contains("quan tri he thong")
                || normalized.matches(".*\\bit\\b.*")
                || normalized.matches(".*\\bsys\\b.*")) {
            return "IT";
        }
        if (normalized.contains("phap che")
                || normalized.contains("bao mat")
                || normalized.matches(".*\\bdpo\\b.*")
                || normalized.matches(".*\\bsec\\b.*")) {
            return "SEC";
        }
        if (normalized.contains("giam doc")
                || normalized.matches(".*\\bbod\\b.*")
                || normalized.matches(".*\\bexec\\b.*")) {
            return "BOD";
        }
        if (normalized.contains("r&d") || normalized.contains("rd") || normalized.contains("nghien cuu")) {
            return "RD";
        }

        // Fallback: Chữ cái đầu hoặc viết tắt
        String cleaned = PHONG_BAN_PATTERN.matcher(normalized).replaceAll(" ");
        cleaned = NON_ALPHANUM_SPACE_PATTERN.matcher(cleaned).replaceAll(" ").trim();
        String[] words = Arrays.stream(MULTI_SPACE_PATTERN.split(cleaned))
                .filter(s -> !s.isBlank())
                .toArray(String[]::new);

        if (words.length > 1) {
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                if (!w.isEmpty()) {
                    sb.append(Character.toUpperCase(w.charAt(0)));
                }
            }
            return sb.length() > 4 ? sb.substring(0, 4) : sb.toString();
        }
        if (words.length == 1 && words[0].length() >= 2) {
            String single = words[0].toUpperCase();
            return single.length() > 4 ? single.substring(0, 4) : single;
        }

        return "GEN";
    }
}
