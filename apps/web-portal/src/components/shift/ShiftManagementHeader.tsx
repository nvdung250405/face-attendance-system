import React from 'react'
import { Plus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui'

interface ShiftManagementHeaderProps {
  isAdjustmentLocked: boolean
  activeTab: 'shifts' | 'assignments'
  onRefresh: () => void
  onOpenCreateShift: () => void
  onOpenAssignShift: () => void
}

export const ShiftManagementHeader: React.FC<ShiftManagementHeaderProps> = ({
  isAdjustmentLocked,
  activeTab,
  onRefresh,
  onOpenCreateShift,
  onOpenAssignShift,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="page-title">
          Quản Lý Ca Làm Việc & Phân Ca
          {isAdjustmentLocked && (
            <span data-testid="shift-payroll-locked-badge" className="sr-only">
              Kỳ công đã khóa
            </span>
          )}
        </h1>
        <p className="page-subtitle">
          Định nghĩa khung giờ ca kíp và phân bổ lịch làm việc linh hoạt theo từng nhân viên
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          data-testid="refresh-shifts-btn"
          title="Làm mới dữ liệu"
          leftIcon={<RotateCw className="w-4 h-4" />}
        >
          Làm mới
        </Button>

        {activeTab === 'shifts' ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenCreateShift}
            disabled={isAdjustmentLocked}
            data-testid="open-create-shift-drawer-btn"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Thêm Ca Mới
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenAssignShift}
            disabled={isAdjustmentLocked}
            data-testid="open-assign-shift-drawer-btn"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Phân Ca Nhân Sự
          </Button>
        )}
      </div>
    </div>
  )
}
