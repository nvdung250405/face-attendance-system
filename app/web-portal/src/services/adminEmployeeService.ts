/**
 * Dịch vụ Quản lý Hồ sơ Nhân sự Phía Quản trị (AdminEmployeeService - APD-WEB-004, API-WEB-009, API-WEB-010, DD-WEB-018).
 *
 * Quản lý danh mục nhân sự, tạo/sửa/đổi trạng thái và cấp lại mật khẩu tạm.
 * RÀNG BUỘC BẢO MẬT: Mật khẩu tạm (temporaryPassword) tuyệt đối KHÔNG được lưu hay cache vào Storage.
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type {
  ApiResponse,
  EmployeeItem,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  UpdateEmployeeRequest,
  EmployeeSearchCriteria,
  PaginatedResult,
  UserStatus,
  UserRole,
} from '@/types'

export interface ResetEmployeeCredentialsResponse {
  temporaryPassword: string
  message: string
}

export class AdminEmployeeService {
  /**
   * Tra cứu danh sách nhân sự có phân trang và bộ lọc (GET /api/v1/admin/employees)
   */
  async getEmployees(criteria?: EmployeeSearchCriteria): Promise<PaginatedResult<EmployeeItem>> {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResult<EmployeeItem>>>(
        '/api/v1/admin/employees',
        { params: criteria }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Lấy chi tiết hồ sơ nhân sự theo ID (GET /api/v1/admin/employees/{id})
   */
  async getEmployeeById(id: number): Promise<EmployeeItem> {
    try {
      const response = await apiClient.get<ApiResponse<EmployeeItem>>(`/api/v1/admin/employees/${id}`)
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Tạo mới hồ sơ nhân sự (POST /api/v1/admin/employees)
   * Trả về temporaryPassword hiển thị 1 lần trên giao diện, không lưu vào storage.
   */
  async createEmployee(data: CreateEmployeeRequest): Promise<CreateEmployeeResponse> {
    try {
      interface RawCreateEmployeeDto {
        employeeId?: number
        id?: number
        employeeCode?: string
        fullName?: string
        email?: string
        role?: UserRole
        status?: UserStatus
        department?: string
        hasBiometric?: boolean
        hasPin?: boolean
        temporaryPassword?: string
        createdAt?: string
        employee?: EmployeeItem
      }

      const response = await apiClient.post<ApiResponse<RawCreateEmployeeDto>>(
        '/api/v1/admin/employees',
        data
      )
      const resData = response.data?.data
      if (!resData) {
        throw new Error('Không nhận được dữ liệu phản hồi từ máy chủ')
      }

      // Nếu đã có cấu trúc lồng { employee, temporaryPassword } (từ mock)
      if (resData.employee) {
        return {
          employee: resData.employee,
          temporaryPassword: resData.temporaryPassword,
        }
      }

      // Chuẩn hóa từ backend REST DTO phẳng: CreateEmployeeResponse
      const employee: EmployeeItem = {
        id: Number(resData.employeeId ?? resData.id ?? 0),
        employeeCode: String(resData.employeeCode || ''),
        fullName: String(resData.fullName || ''),
        email: String(resData.email || ''),
        role: (resData.role as UserRole) || 'EMPLOYEE',
        status: (resData.status as UserStatus) || 'PENDING_CONSENT',
        department: String(resData.department || ''),
        hasBiometric: Boolean(resData.hasBiometric),
        hasPin: Boolean(resData.hasPin),
        createdAt: String(resData.createdAt || new Date().toISOString()),
      }

      return {
        employee,
        temporaryPassword: resData.temporaryPassword,
      }
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cập nhật thông tin hồ sơ nhân sự (PATCH /api/v1/admin/employees/{id})
   */
  async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<EmployeeItem> {
    try {
      const response = await apiClient.patch<ApiResponse<EmployeeItem>>(
        `/api/v1/admin/employees/${id}`,
        data
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cập nhật trạng thái hoạt động của nhân sự (PATCH /api/v1/admin/employees/{id}/status)
   */
  async updateEmployeeStatus(id: number, status: UserStatus): Promise<EmployeeItem> {
    try {
      const response = await apiClient.patch<ApiResponse<EmployeeItem>>(
        `/api/v1/admin/employees/${id}/status`,
        { status }
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }

  /**
   * Cấp lại mật khẩu tạm cho nhân sự (POST /api/v1/admin/employees/{id}/credentials/reset)
   * Trả về temporaryPassword hiển thị duy nhất 1 lần, các phiên cũ bị thu hồi.
   */
  async resetCredentials(id: number): Promise<ResetEmployeeCredentialsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ResetEmployeeCredentialsResponse>>(
        `/api/v1/admin/employees/${id}/credentials/reset`
      )
      return response.data.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  }
}

export const adminEmployeeService = new AdminEmployeeService()
