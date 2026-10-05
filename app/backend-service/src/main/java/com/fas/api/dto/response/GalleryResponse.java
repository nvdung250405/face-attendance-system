package com.fas.api.dto.response;

import java.util.List;

/**
 * Danh mục đầy đủ vector ArcFace 512D của nhân viên đang ACTIVE
 * ({@code GET /api/v1/kiosk/gallery} - APD-BE-001).
 *
 * @param galleryVersion phiên bản danh mục vector hiện hành
 * @param totalCount     tổng số vector trong danh mục
 * @param items          danh sách vector chi tiết
 */
public record GalleryResponse(
        int galleryVersion,
        int totalCount,
        List<GalleryItem> items) {
}
