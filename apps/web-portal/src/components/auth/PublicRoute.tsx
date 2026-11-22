/**
 * Public Route Component (SOL-WEB-001).
 * Nếu người dùng đã đăng nhập, tự động chuyển hướng đến cổng mặc định tương ứng với vai trò.
 */

import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'

interface PublicRouteProps {
  children?: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && user) {
    const defaultPath = getDefaultPathForRole(user.role)
    return <Navigate to={defaultPath} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
