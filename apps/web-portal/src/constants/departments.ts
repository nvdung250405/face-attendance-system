/**
 * Standardized Department Names (EXP3-16, SOL-BE-004, TASK-WEB-019).
 * Centralized source of truth to avoid shotgun surgery across views.
 */

export const DEPARTMENTS = [
  'Phòng Kỹ thuật & Tích hợp',
  'Phòng Nhân sự & Đào tạo',
  'Phòng Kinh doanh & Khách hàng',
  'Phòng Kế toán - Tài chính',
  'Phòng Kho vận & Logistics',
  'Ban Quản Trị Hệ Thống',
  'Ban Pháp chế & Bảo mật',
  'Phòng Kỹ thuật',
  'Phòng Nhân sự',
  'Phòng Kế toán',
  'Phòng Kinh doanh',
  'Ban Giám đốc',
] as const

export type DepartmentName = (typeof DEPARTMENTS)[number]

export const DEFAULT_DEPARTMENTS = DEPARTMENTS
