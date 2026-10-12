import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'

export const UnauthorizedView: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const homePath = getDefaultPathForRole(user?.role)

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-xl p-8 shadow-sm space-y-4">
        <div className="text-4xl font-extrabold text-status-warning">403</div>
        <h1 className="text-xl font-bold text-text-primary">Truy cập bị từ chối</h1>
        <p className="text-sm text-text-secondary">
          Bạn không có quyền truy cập vào chức năng này với vai trò hiện tại ({user?.role || 'Chưa xác thực'}).
        </p>
        <div>
          <Link
            to={homePath}
            className="inline-block px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Quay về trang chính
          </Link>
        </div>
      </div>
    </div>
  )
}
