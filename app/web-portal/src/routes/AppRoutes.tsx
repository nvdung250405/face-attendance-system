/**
 * Bộ Định Tuyến Chính của Ứng dụng Cổng Web (SOL-WEB-001, BLD-WEB-012, DD-WEB-002).
 * Phân luồng điều hướng Dual-Role (HR/ADMIN/DPO vs EMPLOYEE) và bảo vệ Protected Routes.
 * AdminShellLayout (UXD-WEB-001, TASK-WEB-009) bọc toàn bộ không gian được bảo vệ.
 */

import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, setupMultiTabAuthSync, getDefaultPathForRole } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'
import { LoginView } from '@/views/auth/LoginView'
import { AdminDashboardView } from '@/views/admin/AdminDashboardView'
import { EmployeeManagementView } from '@/views/admin/EmployeeManagementView'
import { AdminKioskManagementView } from '@/views/admin/AdminKioskManagementView'
import { AdminAuditLogView } from '@/views/admin/AdminAuditLogView'
import { EmployeeDashboardView } from '@/views/employee/EmployeeDashboardView'
import { EmployeeConsentView } from '@/views/employee/EmployeeConsentView'
import { EmployeeDataRequestsView } from '@/views/employee/EmployeeDataRequestsView'
import { UnauthorizedView } from '@/views/UnauthorizedView'
import { NotFoundView } from '@/views/NotFoundView'

export const RootRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated && user) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />
  }
  return <Navigate to="/login" replace />
}

export const AppRoutes: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
    const cleanup = setupMultiTabAuthSync()
    return cleanup
  }, [initialize])

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Login Route */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginView />
          </PublicRoute>
        }
      />

      {/* ── Không gian được bảo vệ — bọc bởi AdminShellLayout ── */}
      <Route element={<AdminShellLayout />}>
        {/* Không gian Quản trị HR / ADMIN / DPO */}
        <Route
          path="/admin"
          element={<ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN', 'DPO']} />}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardView />} />
          <Route
            path="employees"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
                <EmployeeManagementView />
              </ProtectedRoute>
            }
          />
          <Route path="kiosks" element={<AdminKioskManagementView />} />
          <Route path="audit-logs" element={<AdminAuditLogView />} />
        </Route>

        {/* Không gian Tự phục vụ Nhân viên EMPLOYEE */}
        <Route
          path="/employee"
          element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}
        >
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboardView />} />
          <Route path="consent" element={<EmployeeConsentView />} />
          <Route path="data-requests" element={<EmployeeDataRequestsView />} />
        </Route>
      </Route>

      {/* Trang lỗi & 404 */}
      <Route path="/unauthorized" element={<UnauthorizedView />} />
      <Route path="*" element={<NotFoundView />} />
    </Routes>
  )
}
