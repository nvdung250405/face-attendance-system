/**
 * Tiện ích đo lường độ mạnh mật khẩu (Password Strength Calculation - UXD-WEB-008, DD-WEB-018).
 */

export type PasswordStrength = 'Rất yếu' | 'Yếu' | 'Trung bình' | 'Mạnh' | 'Rất mạnh'

export function calculatePasswordStrength(pwd: string): {
  score: number
  label: PasswordStrength
  colorClass: string
  barWidth: string
} {
  if (!pwd) {
    return { score: 0, label: 'Rất yếu', colorClass: 'bg-slate-200', barWidth: '0%' }
  }

  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd)) score += 1
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 1

  if (score <= 1) {
    return { score: 1, label: 'Rất yếu', colorClass: 'bg-rose-500', barWidth: '20%' }
  }
  if (score === 2) {
    return { score: 2, label: 'Yếu', colorClass: 'bg-rose-400', barWidth: '40%' }
  }
  if (score === 3) {
    return { score: 3, label: 'Trung bình', colorClass: 'bg-amber-500', barWidth: '65%' }
  }
  if (score === 4) {
    return { score: 4, label: 'Mạnh', colorClass: 'bg-emerald-500', barWidth: '85%' }
  }
  return { score: 5, label: 'Rất mạnh', colorClass: 'bg-emerald-600', barWidth: '100%' }
}
