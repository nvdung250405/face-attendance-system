import React from 'react'
import { Lock } from 'lucide-react'
import type { PayrollPeriodResponse } from '@/types'

interface ShiftPayrollLockedBannerProps {
  selectedPeriod: PayrollPeriodResponse | null
}

export const ShiftPayrollLockedBanner: React.FC<ShiftPayrollLockedBannerProps> = ({ selectedPeriod }) => (
  <div
    data-testid="payroll-locked-warning-banner"
    className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs"
  >
    <div className="p-1.5 rounded-lg bg-amber-200 text-amber-800 mt-0.5 shrink-0">
      <Lock className="w-4 h-4" />
    </div>
    <div className="space-y-0.5 text-xs">
      <p className="font-bold">
        Kỳ công đang bị KHÓA điều chỉnh {selectedPeriod ? `(Kỳ ${selectedPeriod.periodMonth}/${selectedPeriod.periodYear})` : ''}
      </p>
      <p className="text-amber-800 leading-relaxed">
        Mọi hoạt động tạo ca, sửa ca và phân ca nhân sự tạm thời bị vô hiệu hóa để bảo toàn dữ liệu bảng công. Vui lòng liên hệ Quản trị viên (ADMIN) mở lại kỳ công nếu cần điều chỉnh.
      </p>
    </div>
  </div>
)
