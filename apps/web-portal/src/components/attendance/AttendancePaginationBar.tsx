/**
 * AttendancePaginationBar: Thanh điều khiển phân trang chuẩn hóa cho bảng chấm công (ARCH-02, TASK-WEB-019).
 * Adapter tương thích ngược bao bọc primitive dùng chung PaginationBar.
 */

import React from 'react'
import { PaginationBar } from '@/components/ui/pagination-bar'

export interface AttendancePaginationBarProps {
  page: number
  pageSize: number
  totalElements: number
  displayedCount: number
  totalPages: number
  onPageChange: (newPage: number | ((prev: number) => number)) => void
  onPageSizeChange: (newPageSize: number) => void
}

export const AttendancePaginationBar: React.FC<AttendancePaginationBarProps> = React.memo(
  ({
    page,
    pageSize,
    totalElements,
    totalPages,
    onPageChange,
    onPageSizeChange,
  }) => {
    return (
      <PaginationBar
        page={page}
        pageSize={pageSize}
        totalElements={totalElements}
        totalPages={totalPages}
        onPageChange={(p) => onPageChange(p)}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[20, 50, 100]}
        itemLabel="lượt điểm danh"
      />
    )
  }
)

AttendancePaginationBar.displayName = 'AttendancePaginationBar'
