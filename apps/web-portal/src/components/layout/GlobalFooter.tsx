/**
 * Chân Trang Toàn Cục (Global Footer) của Hệ Thống FAS Web Portal.
 * Chuẩn hóa theo triết lý SaaS Enterprise (Impeccable Operate Mode).
 *
 * Hiển thị:
 * - Thông tin bản quyền doanh nghiệp và phiên bản hệ thống.
 * - Liên kết tuân thủ bảo vệ dữ liệu cá nhân & sinh trắc học (Nghị định 13/2023/NĐ-CP).
 * - Chỉ báo trạng thái máy chủ và thời gian vận hành hệ thống.
 */

import React from 'react'
import { ShieldCheck, Server } from 'lucide-react'

export const GlobalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      data-testid="global-footer"
      className="mt-auto border-t border-slate-200/80 bg-white/60 backdrop-blur-xs py-4 px-4 sm:px-6"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        {/* Bản quyền & Phiên bản */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
          <span className="font-medium text-slate-700">
            © {currentYear} FAS Enterprise.
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Bảo lưu mọi quyền.</span>
          <span className="hidden md:inline text-slate-300">•</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60 font-semibold">
            v2.4.0
          </span>
        </div>

        {/* Trạng thái SLA & Tuân thủ NĐ13 */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-1 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            <Server size={13} className="shrink-0" />
            <span>Hệ thống trực tuyến (SLA 99.9%)</span>
          </div>

          <span className="hidden sm:inline text-slate-300">|</span>

          <div className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 transition-colors">
            <ShieldCheck size={13} className="text-indigo-500 shrink-0" />
            <span>Tuân thủ NĐ 13/2023/NĐ-CP</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
