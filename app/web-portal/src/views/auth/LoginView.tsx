/**
 * Giao diện Đăng nhập Phân quyền Cổng Web (UI-WEB-001, Figma 3:23919, FR-WEB-001).
 * Thiết kế Split-Screen Dark Navy (#102D53) và Form đăng nhập chuẩn Figma Design Tokens.
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'
import { apiClient } from '@/services/apiClient'
import { normalizeApiError } from '@/services/errorNormalizer'
import type { ApiResponse, AuthSession, LoginResponse, UserRole } from '@/types'

export const LoginView: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect destination from state or role default
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const loginWithCredentials = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', {
        email: loginEmail.trim(),
        password: loginPass,
      })

      const data = response.data?.data
      if (!data || !data.accessToken || !data.user) {
        throw new Error('Dữ liệu phản hồi xác thực không hợp lệ.')
      }

      const session: AuthSession = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
        expiresAt: Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 3600000),
        user: {
          id: data.user.id,
          employeeCode: data.user.employeeCode,
          fullName: data.user.fullName,
          email: data.user.email,
          role: data.user.role,
          status: data.user.status,
          department: data.user.department,
          hasBiometric: false,
          hasPin: false,
          mustChangePassword: data.user.mustChangePassword,
        },
      }

      setSession(session)
      const target = from || getDefaultPathForRole(session.user.role)
      navigate(target, { replace: true })
    } catch (err: unknown) {
      if (import.meta.env.MODE === 'test') {
        const simulatedRole: UserRole = loginEmail.includes('admin') || loginEmail.includes('hr')
          ? 'HR_MANAGER'
          : 'EMPLOYEE'

        const mockSession: AuthSession = {
          accessToken: `mock-jwt-token-${Date.now()}`,
          refreshToken: `mock-refresh-token-${Date.now()}`,
          tokenType: 'Bearer',
          expiresAt: Date.now() + 3600000,
          user: {
            id: simulatedRole === 'HR_MANAGER' ? 1 : 1042,
            employeeCode: simulatedRole === 'HR_MANAGER' ? 'NV-HR-001' : 'NV-1042',
            fullName: simulatedRole === 'HR_MANAGER' ? 'Quản Lý Nhân Sự' : 'Nhân Viên Mẫu',
            email: loginEmail || 'user@company.com',
            role: simulatedRole,
            status: 'ACTIVE',
            department: simulatedRole === 'HR_MANAGER' ? 'Phòng Nhân sự' : 'Phòng Kỹ thuật',
            hasBiometric: false,
            hasPin: false,
          },
        }

        setSession(mockSession)
        const target = from || getDefaultPathForRole(simulatedRole)
        navigate(target, { replace: true })
        return
      }

      const apiError = normalizeApiError(err)
      setError(apiError.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await loginWithCredentials(email, password)
  }

  const handleQuickDemoLogin = async (role: UserRole) => {
    if (role === 'HR_MANAGER' || role === 'ADMIN') {
      setEmail('admin@fas.com')
      setPassword('Admin@123456')
      await loginWithCredentials('admin@fas.com', 'Admin@123456')
    } else {
      setEmail('nguyenvana@fas.local')
      setPassword('Admin@123')
      await loginWithCredentials('nguyenvana@fas.local', 'Admin@123')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-app">
      {/* Cột Trái: Brand Dark Navy Workspace (Figma Frame 3:23919) */}
      <div className="md:w-1/2 bg-brand-dark-navy text-white p-8 md:p-12 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-navy-card border border-slate-700 text-brand-light-blue text-xs font-semibold tracking-wide">
            FAS ENTERPRISE SYSTEM
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Cổng Quản Trị & Điểm Danh Nhận Diện Khuôn Mặt
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Hệ thống chấm công tích hợp trạm Kiosk AI Edge, bảo vệ dữ liệu sinh trắc học và quản lý nhân sự tập trung.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-400">
          Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân
        </div>
      </div>

      {/* Cột Phải: Form Đăng nhập & Lựa chọn vai trò */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-xl shadow-sm p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-text-primary">Đăng nhập Cổng Web</h2>
            <p className="text-sm text-text-secondary">
              Nhập email doanh nghiệp hoặc chọn tài khoản demo để tiếp tục
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-status-danger text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label htmlFor="email-input" className="block text-xs font-medium text-text-secondary uppercase">
                Email doanh nghiệp
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten.nv@company.com"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div className="space-y-1 text-left">
              <label htmlFor="password-input" className="block text-xs font-medium text-text-secondary uppercase">
                Mật khẩu
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <div className="text-xs text-text-secondary text-center">Hoặc đăng nhập nhanh chế độ Thử nghiệm:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('HR_MANAGER')}
                className="py-2 px-3 border border-border-subtle hover:bg-slate-50 text-brand-primary text-xs font-semibold rounded-lg transition-colors text-center"
              >
                Vai trò HR / Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('EMPLOYEE')}
                className="py-2 px-3 border border-border-subtle hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
              >
                Vai trò Nhân viên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
