/**
 * Hợp đồng dữ liệu Quản lý Nhân sự (API-WEB-006, API-WEB-009, API-WEB-010).
 */

import type { UserRole, UserStatus } from './auth'

export interface EmployeeItem {
  readonly id: number
  readonly employeeCode: string
  readonly fullName: string
  readonly email: string
  readonly department: string
  readonly role: UserRole
  readonly status: UserStatus
  readonly hasBiometric: boolean
  readonly hasPin: boolean
  readonly createdAt: string
}

export interface CreateEmployeeRequest {
  employeeCode: string
  fullName: string
  email: string
  department: string
  role: UserRole
}

export interface CreateEmployeeResponse {
  employee: EmployeeItem
  temporaryPassword?: string
}

export interface UpdateEmployeeRequest {
  fullName?: string
  department?: string
  role?: UserRole
}

export interface EmployeeSearchCriteria {
  page?: number
  size?: number
  keyword?: string
  department?: string
  status?: UserStatus
}
