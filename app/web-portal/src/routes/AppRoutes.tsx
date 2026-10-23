/**
 * Bộ Định Tuyến Chính của Ứng dụng Cổng Web (SOL-WEB-001, BLD-WEB-012, DD-WEB-002).
 * Phân luồng điều hướng Dual-Role (HR/ADMIN/DPO vs EMPLOYEE) và bảo vệ Protected Routes.
 * AdminShellLayout (UXD-WEB-001, TASK-WEB-009) bọc toàn bộ không gian được bảo vệ.
 * Áp dụng React.lazy() và Suspense để Code-Splitting các View độc lập nhằm tối ưu kích thước bundle.
 */

import React, { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, setupMultiTabAuthSync, getDefaultPathForRole } from '@/store/authStore'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { AdminShellLayout } from '@/components/layout/AdminShellLayout'

// Lazy-loaded Views để tối ưu kích thước bundle và thời gian tải trang ban đầu
const LoginView = lazy(() => import('@/views/auth/LoginView').then((m) => ({ default: m.LoginView })))
const AdminDashboardView = lazy(() => import('@/views/admin/AdminDashboardView').then((m) => ({ default: m.AdminDashboardView })))
const EmployeeManagementView = lazy(() => import('@/views/admin/EmployeeManagementView').then((m) => ({ default: m.EmployeeManagementView })))
const AdminKioskManagementView = lazy(() => import('@/views/admin/AdminKioskManagementView').then((m) => ({ default: m.AdminKioskManagementView })))
const AdminAuditLogView = lazy(() => import('@/views/admin/AdminAuditLogView').then((m) => ({ default: m.AdminAuditLogView })))
const EmployeeDashboardView = lazy(() => import('@/views/employee/EmployeeDashboardView').then((m) => ({ default: m.EmployeeDashboardView })))
const EmployeeConsentView = lazy(() => import('@/views/employee/EmployeeConsentView').then((m) => ({ default: m.EmployeeConsentView })))
const EmployeeDataRequestsView = lazy(() => import('@/views/employee/EmployeeDataRequestsView').then((m) => ({ default: m.EmployeeDataRequestsView })))
const AdminAttendanceView = lazy(() => import('@/views/admin/AdminAttendanceView').then((m) => ({ default: m.AdminAttendanceView })))
const AdminShiftManagementView = lazy(() => import('@/views/admin/AdminShiftManagementView').then((m) => ({ default: m.AdminShiftManagementView })))
const AdminPayrollPeriodView = lazy(() => import('@/views/admin/AdminPayrollPeriodView').then((m) => ({ default: m.AdminPayrollPeriodView })))
const AdminExcuseManagementView = lazy(() => import('@/views/admin/AdminExcuseManagementView').then((m) => ({ default: m.AdminExcuseManagementView })))
const EmployeeExcuseHistoryView = lazy(() => import('@/views/employee/EmployeeExcuseHistoryView').then((m) => ({ default: m.EmployeeExcuseHistoryView })))
const UnauthorizedView = lazy(() => import('@/views/UnauthorizedView').then((m) => ({ default: m.UnauthorizedView })))
const NotFoundView = lazy(() => import('@/views/NotFoundView').then((m) => ({ default: m.NotFoundView })))

export const RouteLoadingFallback: React.FC = () => (
  <div
    data-testid="route-loading-fallback"
    className="flex min-h-[300px] w-full items-center justify-center py-12"
    aria-label="Đang tải trang..."
  >
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-primary border-t-transparent" />
      <span className="text-sm font-medium text-text-secondary">Đang tải trang...</span>
    </div>
  </div>
)

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
    <Suspense fallback={<RouteLoadingFallback />}>
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
            <Route
              path="shifts"
              element={
                <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
                  <AdminShiftManagementView />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll-periods"
              element={
                <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
                  <AdminPayrollPeriodView />
                </ProtectedRoute>
              }
            />
            <Route path="kiosks" element={<AdminKioskManagementView />} />
            <Route path="attendance" element={<AdminAttendanceView />} />
            <Route path="reports" element={<AdminAttendanceView />} />
            <Route path="excuse-requests" element={<AdminExcuseManagementView />} />
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
            <Route path="excuse-requests" element={<EmployeeExcuseHistoryView />} />
            <Route path="data-requests" element={<EmployeeDataRequestsView />} />
          </Route>
        </Route>

        {/* Trang lỗi & 404 */}
        <Route path="/unauthorized" element={<UnauthorizedView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </Suspense>
  )
}
