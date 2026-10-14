/**
 * Màn hình Đổi Mật khẩu Bắt buộc (Blocking Mode - TASK-WEB-029, BLD-WEB-024, UXD-WEB-008).
 *
 * Chặn điều hướng toàn diện khi tài khoản mới hoặc vừa được cấp lại mật khẩu tạm.
 * Người dùng không thể truy cập các trang nghiệp vụ khác cho đến khi hoàn tất đổi mật khẩu.
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  KeyRound,
} from 'lucide-react'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'
import { credentialService } from '@/services/credentialService'
import { logoutService } from '@/services/logoutService'
import { calculatePasswordStrength } from '@/components/account/passwordStrength'
import type { NormalizedApiError } from '@/services/errorNormalizer'

export const ForceChangePasswordView: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      navigate(getDefaultPathForRole(user.role), { replace: true })
    }
  }, [user, navigate])

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const strength = calculatePasswordStrength(newPassword)

  const handleLogout = async () => {
    await logoutService.logout()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!oldPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại hoặc mật khẩu tạm.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 8 ký tự.')
      return
    }

    if (newPassword === oldPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp.')
      return
    }

    try {
      setIsLoading(true)
      const res = await credentialService.changePassword({
        oldPassword,
        newPassword,
      })

      setSuccessMessage(
        res.message || 'Đổi mật khẩu thành công! Đang chuyển hướng vào hệ thống...'
      )

      // Cập nhật trạng thái người dùng trong store: xóa cờ mustChangePassword
      useAuthStore.setState((state) => {
        if (!state.user) return state
        const updatedUser = {
          ...state.user,
          mustChangePassword: false,
        }
        return {
          user: updatedUser,
          session: state.session
            ? {
                ...state.session,
                user: updatedUser,
              }
            : null,
        }
      })

      // Điều hướng sau 1.2s
      setTimeout(() => {
        if (user) {
          navigate(getDefaultPathForRole(user.role), { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      }, 1200)
    } catch (err: unknown) {
      const apiErr = err as NormalizedApiError
      setErrorMessage(
        apiErr?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin mật khẩu cũ.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      data-testid="force-change-password-view"
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner tiêu đề */}
        <div className="bg-linear-to-r from-brand-primary to-indigo-700 p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Yêu Cầu Đổi Mật Khẩu Bắt Buộc</h1>
          <p className="text-xs text-white/80 mt-1">
            Thiết lập mật khẩu an toàn mới trước khi tiếp tục truy cập Cổng Web
          </p>
        </div>

        {/* Nội dung form */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Cảnh báo an ninh */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Chính sách bảo mật tài khoản:</p>
              <p className="text-2xs text-amber-800/90 mt-0.5">
                Tài khoản <span className="font-semibold">{user?.fullName}</span> ({user?.employeeCode}) đang dùng mật khẩu tạm thời hoặc được yêu cầu đổi mật khẩu lần đầu. Bạn không thể chuyển sang màn hình khác cho tới khi hoàn tất bước này.
              </p>
            </div>
          </div>

          {/* Lỗi hoặc Thành công */}
          {errorMessage && (
            <div
              data-testid="force-change-password-error"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-status-danger text-xs flex items-center gap-2 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              data-testid="force-change-password-success"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-status-success text-xs flex items-center gap-2 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div className="space-y-1">
              <label
                htmlFor="force-old-password"
                className="text-xs font-semibold text-text-secondary"
              >
                Mật khẩu tạm thời hiện tại <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="force-old-password"
                  type={showOld ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="force-old-password-input"
                  placeholder="Nhập mật khẩu tạm được cấp..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1">
              <label
                htmlFor="force-new-password"
                className="text-xs font-semibold text-text-secondary"
              >
                Mật khẩu mới an toàn <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="force-new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="force-new-password-input"
                  placeholder="Tối thiểu 8 ký tự, có chữ và số..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Chỉ số độ mạnh mật khẩu trực quan */}
              {newPassword && (
                <div data-testid="force-password-strength" className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-text-tertiary">Độ mạnh mật khẩu:</span>
                    <span
                      className="font-bold"
                      style={{
                        color:
                          strength.score <= 1
                            ? '#ef4444'
                            : strength.score === 2
                            ? '#f59e0b'
                            : strength.score === 3
                            ? '#3b82f6'
                            : '#10b981',
                      }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          strength.score >= step
                            ? strength.score <= 1
                              ? 'bg-rose-500'
                              : strength.score === 2
                              ? 'bg-amber-500'
                              : strength.score === 3
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1">
              <label
                htmlFor="force-confirm-password"
                className="text-xs font-semibold text-text-secondary"
              >
                Xác nhận lại mật khẩu mới <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="force-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  data-testid="force-confirm-password-input"
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border-subtle bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút hành động */}
            <div className="pt-3 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isLoading}
                data-testid="force-change-password-submit-btn"
                className="w-full py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                <span>{isLoading ? 'Đang cập nhật mật khẩu...' : 'Cập Nhật Mật Khẩu & Vào Hệ Thống'}</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                data-testid="force-change-password-logout-btn"
                className="w-full py-2.5 px-4 rounded-xl border border-border-subtle bg-white hover:bg-slate-50 text-text-secondary hover:text-text-primary text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
