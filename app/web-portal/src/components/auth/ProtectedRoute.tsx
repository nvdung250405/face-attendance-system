/**
 * Protected Route & Role Guard Component (SOL-WEB-001, BLD-WEB-012, TST-WEB-013).
 * Kiểm tra trạng thái xác thực và phân quyền Role của người dùng.
 */

import React from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const location = useLocation()
  const { isAuthenticated, user } = useAuthStore()

  // 1. Nếu chưa đăng nhập: chuyển hướng về /login và lưu lại đường dẫn trước đó
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // 2. Chặn điều hướng khi tài khoản bắt buộc phải đổi mật khẩu (TASK-WEB-029, BLD-WEB-024)
  if (user?.mustChangePassword && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />
  }

  // 3. Nếu đã đăng nhập nhưng không có vai trò phù hợp: điều hướng về cổng mặc định của vai trò đó
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const targetPath = getDefaultPathForRole(user.role)
    return <Navigate to={targetPath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
