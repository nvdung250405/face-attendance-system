/**
 * Giao diện Đăng nhập Phân quyền Cổng Web (UI-WEB-001, Figma 3:23919, FR-WEB-001).
 * Thiết kế Split-Screen Dark Navy (#102D53) và Form đăng nhập chuẩn Figma Design Tokens.
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'
import { apiClient } from '@/services/apiClient'
import { normalizeApiError } from '@/services/errorNormalizer'
import type { ApiResponse, AuthSession, LoginResponse } from '@/types'

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
          hasBiometric: Boolean(data.user.hasBiometric),
          hasPin: Boolean(data.user.hasPin),
          mustChangePassword: data.user.mustChangePassword,
        },
      }

      setSession(session)
      const target = from || getDefaultPathForRole(session.user.role)
      navigate(target, { replace: true })
    } catch (err: unknown) {
      const apiError = normalizeApiError(err)
      setError(apiError.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập email doanh nghiệp.')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }
    await loginWithCredentials(trimmedEmail, password)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-app">
      {/* Cột Trái: Brand Dark Navy Workspace (Figma Frame 3:23919) - Chỉ hiển thị trên Desktop (md+) */}
      <div className="hidden md:flex md:w-1/2 bg-brand-dark-navy text-white p-8 md:p-12 flex-col justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-navy-card border border-slate-700 text-brand-light-blue text-xs font-semibold tracking-wide">
            FAS ENTERPRISE SYSTEM
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
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

      {/* Cột Phải: Form Đăng nhập - Căn giữa trên Desktop, gọn gàng trên Mobile */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-12 flex-1">
        <div className="w-full max-w-md bg-surface-card border border-border-subtle rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
          {/* Logo & Brand header thu gọn riêng cho Mobile */}
          <div className="md:hidden flex items-center gap-2.5 pb-2 border-b border-border-subtle">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-black text-white text-xs shrink-0 shadow-sm ring-1 ring-indigo-400/30">
              FAS
            </div>
            <div>
              <div className="text-xs font-bold text-text-primary tracking-tight">FAS Enterprise System</div>
              <div className="text-[10px] text-text-muted">Cổng Quản Trị & Điểm Danh</div>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">Đăng nhập Cổng Web</h2>
            <p className="text-xs sm:text-sm text-text-secondary">
              Nhập email doanh nghiệp và mật khẩu để tiếp tục
            </p>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 bg-rose-50 border border-rose-200 text-status-danger text-xs sm:text-sm rounded-xl"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label htmlFor="email-input" className="block text-xs font-semibold text-text-secondary">
                Email doanh nghiệp
              </label>
              <input
                id="email-input"
                type="email"
                required
                autoComplete="username"
                aria-invalid={Boolean(error)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten.nv@company.com"
                className="w-full px-3 py-2.5 min-h-[44px] border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <div className="space-y-1 text-left">
              <label htmlFor="password-input" className="block text-xs font-semibold text-text-secondary">
                Mật khẩu
              </label>
              <input
                id="password-input"
                type="password"
                required
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 min-h-[44px] border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-brand-primary focus:border-transparent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
