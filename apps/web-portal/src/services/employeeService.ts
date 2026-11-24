/**
 * Dịch vụ Quản lý Vai trò Người dùng (User Role Management)
 * (APD-BE-025, API-BE-043, FR-BE-023, DD-BE-026, TASK-WEB-028)
 */

import { apiClient } from './apiClient'
import { normalizeApiError } from './errorNormalizer'
import type { ApiResponse, UserRole } from '@/types'

export interface UserRoleResponse {
  userId: number
  employeeCode: string
  fullName: string
  email: string
  role: UserRole
}

export async function updateUserRole(userId: number, role: UserRole): Promise<void> {
  try {
    await apiClient.patch<ApiResponse<UserRoleResponse>>(`/api/v1/admin/users/${userId}/role`, {
      role,
    })
  } catch (error) {
    throw normalizeApiError(error)
  }
}

export const employeeService = {
  updateUserRole,
}
