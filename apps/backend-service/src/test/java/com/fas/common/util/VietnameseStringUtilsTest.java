package com.fas.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Kiểm thử tiện ích chuỗi tiếng Việt VietnameseStringUtils")
class VietnameseStringUtilsTest {

    @Test
    @DisplayName("Loại bỏ dấu tiếng Việt chính xác")
    void removeDiacritics_Success() {
        assertThat(VietnameseStringUtils.removeDiacritics("Hành chính")).isEqualTo("Hanh chinh");
        assertThat(VietnameseStringUtils.removeDiacritics("Kỹ thuật & Tích hợp")).isEqualTo("Ky thuat & Tich hop");
        assertThat(VietnameseStringUtils.removeDiacritics("Đà Nẵng")).isEqualTo("Da Nang");
        assertThat(VietnameseStringUtils.removeDiacritics("Hồ Chí Minh")).isEqualTo("Ho Chi Minh");
        assertThat(VietnameseStringUtils.removeDiacritics(null)).isEmpty();
    }

    @Test
    @DisplayName("Bóc tách slug ca làm việc")
    void extractShiftSlug_Success() {
        assertThat(VietnameseStringUtils.extractShiftSlug("Hành chính")).isEqualTo("HC");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Hành Chính")).isEqualTo("HC");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Sáng")).isEqualTo("SANG");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Chiều")).isEqualTo("CHIEU");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Đêm")).isEqualTo("DEM");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Tối")).isEqualTo("TOI");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Gãy")).isEqualTo("GAY");
        assertThat(VietnameseStringUtils.extractShiftSlug("Ca Part-Time")).isEqualTo("PT");
        assertThat(VietnameseStringUtils.extractShiftSlug("")).isEqualTo("CA");
        assertThat(VietnameseStringUtils.extractShiftSlug(null)).isEqualTo("CA");
    }

    @Test
    @DisplayName("Bóc tách slug thời gian")
    void extractTimeSlug_Success() {
        assertThat(VietnameseStringUtils.extractTimeSlug(LocalTime.of(8, 0), LocalTime.of(17, 0))).isEqualTo("0817");
        assertThat(VietnameseStringUtils.extractTimeSlug(LocalTime.of(6, 0), LocalTime.of(14, 0))).isEqualTo("0614");
        assertThat(VietnameseStringUtils.extractTimeSlug(LocalTime.of(14, 0), LocalTime.of(22, 0))).isEqualTo("1422");
        assertThat(VietnameseStringUtils.extractTimeSlug(LocalTime.of(22, 0), LocalTime.of(6, 0))).isEqualTo("2206");
        assertThat(VietnameseStringUtils.extractTimeSlug(LocalTime.of(8, 30), LocalTime.of(17, 30))).isEqualTo("08301730");
        assertThat(VietnameseStringUtils.extractTimeSlug(null, null)).isEqualTo("0000");
    }

    @Test
    @DisplayName("Bóc tách slug địa điểm")
    void extractLocationSlug_Success() {
        assertThat(VietnameseStringUtils.extractLocationSlug("Hà Nội")).isEqualTo("HN");
        assertThat(VietnameseStringUtils.extractLocationSlug("Cổng chính Hà Nội")).isEqualTo("HN");
        assertThat(VietnameseStringUtils.extractLocationSlug("Tòa nhà Bitexco, TP.HCM")).isEqualTo("HCM");
        assertThat(VietnameseStringUtils.extractLocationSlug("Văn phòng Hồ Chí Minh")).isEqualTo("HCM");
        assertThat(VietnameseStringUtils.extractLocationSlug("Chi nhánh Đà Nẵng")).isEqualTo("DN");
        assertThat(VietnameseStringUtils.extractLocationSlug("Khu công nghiệp Bắc Ninh")).isEqualTo("BN");
        assertThat(VietnameseStringUtils.extractLocationSlug("Kho tổng")).isEqualTo("KHO");
        assertThat(VietnameseStringUtils.extractLocationSlug("Kho vận Long Biên")).isEqualTo("KHO");
        assertThat(VietnameseStringUtils.extractLocationSlug("")).isEqualTo("GEN");
        assertThat(VietnameseStringUtils.extractLocationSlug("Phòng họp số 3")).isEqualTo("PHS");
    }

    @Test
    @DisplayName("Bóc tách slug phòng ban")
    void extractDepartmentSlug_Success() {
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kỹ thuật")).isEqualTo("ENG");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kỹ thuật & Tích hợp")).isEqualTo("ENG");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Nhân sự")).isEqualTo("HR");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Nhân sự & Đào tạo")).isEqualTo("HR");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kinh doanh")).isEqualTo("SAL");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kinh doanh & Khách hàng")).isEqualTo("SAL");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kế toán")).isEqualTo("ACC");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kế toán - Tài chính")).isEqualTo("ACC");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Phòng Kho vận & Logistics")).isEqualTo("LOG");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("Trung tâm R&D")).isEqualTo("RD");
        assertThat(VietnameseStringUtils.extractDepartmentSlug("")).isEqualTo("GEN");
    }
}
