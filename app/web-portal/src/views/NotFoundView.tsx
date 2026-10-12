import React from 'react'
import { Link } from 'react-router-dom'

export const NotFoundView: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface-card border border-border-subtle rounded-xl p-8 shadow-sm space-y-4">
        <div className="text-4xl font-extrabold text-brand-primary">404</div>
        <h1 className="text-xl font-bold text-text-primary">Không tìm thấy trang</h1>
        <p className="text-sm text-text-secondary">
          Địa chỉ yêu cầu không tồn tại hoặc đã được chuyển dời.
        </p>
        <div>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
