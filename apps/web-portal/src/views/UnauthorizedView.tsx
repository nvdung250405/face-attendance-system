import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuthStore, getDefaultPathForRole } from '@/store/authStore'

export const UnauthorizedView: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const homePath = getDefaultPathForRole(user?.role)

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-2xl p-8 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-100 text-status-warning flex items-center justify-center shadow-xs">
          <ShieldAlert size={32} strokeWidth={2} />
        </div>
        <div>
          <div className="text-4xl font-black text-status-warning tracking-tight">403</div>
          <h1 className="text-xl font-bold text-text-primary mt-1">Truy cập bị từ chối</h1>
        </div>
        <div className="pt-2">
          <Link
            to={homePath}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 min-h-[44px] bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>Quay về trang chính</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
