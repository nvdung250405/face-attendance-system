import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, Home } from 'lucide-react'

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 sm:p-6 text-center">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-2xl p-8 shadow-sm space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 text-brand-primary flex items-center justify-center shadow-xs">
          <FileQuestion size={32} strokeWidth={2} />
        </div>
        <div>
          <div className="text-4xl font-black text-brand-primary tracking-tight">404</div>
          <h1 className="text-xl font-bold text-text-primary mt-1">Không tìm thấy trang</h1>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 min-h-[44px] bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Home size={18} />
            <span>Quay về trang chủ</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
