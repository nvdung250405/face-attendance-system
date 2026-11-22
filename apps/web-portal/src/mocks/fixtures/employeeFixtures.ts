/**
 * Chuẩn Fixtures Phản hồi Hồ sơ Nhân sự & Vòng đời Tài khoản (TASK-WEB-024, API-WEB-009, API-WEB-010).
 */

import type {
  ApiResponse,
  EmployeeItem,
  PaginatedResult,
  CreateEmployeeResponse,
  ChangePasswordResponse,
} from '@/types'
import type { ResetEmployeeCredentialsResponse } from '@/services/adminEmployeeService'

export const mockEmployeeList: EmployeeItem[] = [
  {
    id: 1,
    employeeCode: 'NV-1042',
    fullName: 'Ngô Văn Dũng',
    email: 'dung.nv@company.com',
    department: 'Phòng Kỹ thuật',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-10-01T08:30:00+07:00',
  },
  {
    id: 2,
    employeeCode: 'NV-HR-001',
    fullName: 'Nguyễn Quản Trị Nhân Sự',
    email: 'hr.manager@company.com',
    department: 'Phòng Nhân sự',
    role: 'HR_MANAGER',
    status: 'ACTIVE',
    hasBiometric: true,
    hasPin: true,
    createdAt: '2026-01-15T08:00:00+07:00',
  },
  {
    id: 3,
    employeeCode: 'NV-1043',
    fullName: 'Lê Thị Mai',
    email: 'mai.lt@company.com',
    department: 'Phòng Kế toán',
    role: 'EMPLOYEE',
    status: 'PENDING_CONSENT',
    hasBiometric: false,
    hasPin: false,
    createdAt: '2026-10-05T09:00:00+07:00',
  },
  {
    id: 4,
    employeeCode: 'NV-1044',
    fullName: 'Phạm Văn Cường',
    email: 'cuong.pv@company.com',
    department: 'Phòng Kinh doanh',
    role: 'EMPLOYEE',
    status: 'INACTIVE',
    hasBiometric: false,
    hasPin: false,
    createdAt: '2026-08-01T08:00:00+07:00',
  },
]

export const mockPaginatedEmployees: PaginatedResult<EmployeeItem> = {
  content: mockEmployeeList,
  page: 0,
  size: 10,
  totalElements: 4,
  totalPages: 1,
  first: true,
  last: true,
}

export const mockCreateEmployeeSuccess: ApiResponse<CreateEmployeeResponse> = {
  success: true,
  code: 'EMPLOYEE_CREATED',
  message: 'Tạo hồ sơ nhân sự thành công',
  data: {
    employee: {
      id: 5,
      employeeCode: 'NV-1045',
      fullName: 'Hoàng Minh Tuấn',
      email: 'tuan.hm@company.com',
      department: 'Phòng Kỹ thuật',
      role: 'EMPLOYEE',
      status: 'PENDING_CONSENT',
      hasBiometric: false,
      hasPin: false,
      createdAt: '2026-10-14T10:00:00+07:00',
    },
    temporaryPassword: 'TempPassword@123',
  },
  timestamp: '2026-10-14T10:00:00.000+07:00',
}

export const mockResetCredentialsSuccess: ApiResponse<ResetEmployeeCredentialsResponse> = {
  success: true,
  code: 'CREDENTIALS_RESET',
  message: 'Cấp lại mật khẩu tạm thành công',
  data: {
    temporaryPassword: 'ResetTempPass#456',
    message: 'Mật khẩu tạm đã được tạo. Các phiên cũ đã được thu hồi.',
  },
  timestamp: '2026-10-14T10:05:00.000+07:00',
}

export const mockChangePasswordSuccess: ApiResponse<ChangePasswordResponse> = {
  success: true,
  code: 'PASSWORD_CHANGED',
  message: 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi.',
  data: {
    message: 'Đổi mật khẩu thành công. Các phiên đăng nhập khác đã được thu hồi.',
    sessionsRevoked: true,
  },
  timestamp: '2026-10-14T10:10:00.000+07:00',
}
