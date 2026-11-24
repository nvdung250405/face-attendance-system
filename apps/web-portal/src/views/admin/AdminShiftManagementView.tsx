/**
 * Màn hình Quản lý Danh mục Ca làm việc & Phân ca Nhân sự
 * (SOL-WEB-007, BLD-WEB-019, UXD-WEB-006, FR-WEB-008, TASK-WEB-025, ARCH-W-01).
 *
 * - Presenter view kết nối useAdminShiftManagement hook (Container/Presenter pattern).
 * - Quản lý CRUD ca làm việc (Shift Catalog): Tạo mới, sửa giờ, ân hạn, đổi trạng thái.
 * - Phân ca nhân sự theo khoảng ngày hiệu lực (Shift Assignment).
 */

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui'
import {
  WeeklyShiftScheduleView,
  ShiftFormDrawer,
  AssignShiftDrawer,
  ShiftCatalogTable,
  ShiftAssignmentToolbar,
  ShiftAssignmentTable,
  ShiftPayrollLockedBanner,
  ShiftManagementHeader,
} from '@/components/shift'
import { useAdminShiftManagement } from './hooks/useAdminShiftManagement'

export const AdminShiftManagementView: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    assignmentViewMode,
    setAssignmentViewMode,
    isAdjustmentLocked,
    selectedPeriod,
    shifts,
    isLoadingShifts,
    togglingShiftId,
    shiftsMap,
    assignments,
    isLoadingAssignments,
    deletingAssignmentId,
    employees,
    isLoadingEmployees,
    searchEmployeeKeyword,
    setSearchEmployeeKeyword,
    filterShiftId,
    setFilterShiftId,
    isShiftDrawerOpen,
    setIsShiftDrawerOpen,
    editingShift,
    shiftFormData,
    setShiftFormData,
    shiftFormError,
    shiftFieldErrors,
    isSubmittingShift,
    isAssignDrawerOpen,
    setIsAssignDrawerOpen,
    assignFormData,
    setAssignFormData,
    assignFormError,
    assignFieldErrors,
    overlapConflict,
    isSubmittingAssign,
    batchProgressText,
    loadShifts,
    loadAssignments,
    handleOpenCreateShiftDrawer,
    handleOpenEditShiftDrawer,
    handleSaveShift,
    handleToggleShiftActive,
    handleOpenAssignDrawer,
    handleQuickAssign,
    handleSaveAssign,
    handleBatchAssign,
    handleApplySuggestedSlot,
    handleRemoveAssignment,
    assignmentToDelete,
    setAssignmentToDelete,
    confirmRemoveAssignment,
    filteredAssignments,
  } = useAdminShiftManagement()

  return (
    <div className="space-y-6" data-testid="admin-shift-management-view">
      <ShiftManagementHeader
        isAdjustmentLocked={isAdjustmentLocked}
        activeTab={activeTab}
        onRefresh={() => {
          void loadShifts()
          void loadAssignments()
        }}
        onOpenCreateShift={handleOpenCreateShiftDrawer}
        onOpenAssignShift={handleOpenAssignDrawer}
      />

      {isAdjustmentLocked && <ShiftPayrollLockedBanner selectedPeriod={selectedPeriod} />}

      {/* ── Tabs Chuyển đổi Đồng bộ Radix Accessible Tabs (F-TECH-13) ── */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'shifts' | 'assignments')}
        className="space-y-6"
      >
        <Tabs.List
          aria-label="Quản lý ca làm việc và phân ca"
          className="border-b border-border-subtle flex items-center gap-6"
        >
          <Tabs.Trigger
            value="shifts"
            data-testid="tab-shifts-btn"
            onClick={() => setActiveTab('shifts')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              activeTab === 'shifts'
                ? 'text-indigo-600 border-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Danh Mục Ca Làm Việc</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
              activeTab === 'shifts' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {shifts.length}
            </span>
          </Tabs.Trigger>

          <Tabs.Trigger
            value="assignments"
            data-testid="tab-assignments-btn"
            onClick={() => setActiveTab('assignments')}
            className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              activeTab === 'assignments'
                ? 'text-indigo-600 border-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Lịch Phân Ca Nhân Sự</span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
              activeTab === 'assignments' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {assignments.length}
            </span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* ── Nội dung Tab 1: Danh mục Ca làm việc (ARCH-001 Subcomponent) ── */}
        <Tabs.Content value="shifts" className="focus-visible:outline-hidden">
          <ShiftCatalogTable
            shifts={shifts}
            isLoadingShifts={isLoadingShifts}
            isAdjustmentLocked={isAdjustmentLocked}
            togglingShiftId={togglingShiftId}
            onEditShift={handleOpenEditShiftDrawer}
            onToggleShiftActive={handleToggleShiftActive}
          />
        </Tabs.Content>

        {/* ── Nội dung Tab 2: Lịch Phân ca Nhân sự (ARCH-001 Subcomponents) ── */}
        <Tabs.Content value="assignments" className="focus-visible:outline-hidden">
          <div className="space-y-4">
            <ShiftAssignmentToolbar
              assignmentViewMode={assignmentViewMode}
              onChangeViewMode={setAssignmentViewMode}
              searchEmployeeKeyword={searchEmployeeKeyword}
              onChangeSearchKeyword={setSearchEmployeeKeyword}
              filterShiftId={filterShiftId}
              onChangeFilterShiftId={setFilterShiftId}
              shifts={shifts}
              filteredCount={filteredAssignments.length}
              totalCount={assignments.length}
              onResetFilters={() => {
                setSearchEmployeeKeyword('')
                setFilterShiftId('')
              }}
            />

            {assignmentViewMode === 'weekly' ? (
              <WeeklyShiftScheduleView
                shifts={shifts}
                assignments={assignments}
                employees={employees}
                isAdjustmentLocked={isAdjustmentLocked}
                onQuickAssign={handleQuickAssign}
                onRemoveAssignment={handleRemoveAssignment}
              />
            ) : (
              <ShiftAssignmentTable
                filteredAssignments={filteredAssignments}
                shiftsMap={shiftsMap}
                isLoadingAssignments={isLoadingAssignments}
                isAdjustmentLocked={isAdjustmentLocked}
                deletingAssignmentId={deletingAssignmentId}
                onRemoveAssignment={handleRemoveAssignment}
              />
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <ShiftFormDrawer
        isOpen={isShiftDrawerOpen}
        onClose={() => setIsShiftDrawerOpen(false)}
        editingShift={editingShift}
        formData={shiftFormData}
        onChangeFormData={setShiftFormData}
        formError={shiftFormError}
        fieldErrors={shiftFieldErrors}
        isSubmitting={isSubmittingShift}
        onSubmit={handleSaveShift}
      />

      <AssignShiftDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        formData={assignFormData}
        onChangeFormData={setAssignFormData}
        formError={assignFormError}
        fieldErrors={assignFieldErrors}
        overlapConflict={overlapConflict}
        onApplySuggestedSlot={handleApplySuggestedSlot}
        isSubmitting={isSubmittingAssign}
        onSubmit={handleSaveAssign}
        onSubmitBatch={handleBatchAssign}
        employees={employees}
        shifts={shifts}
        isLoadingEmployees={isLoadingEmployees}
        progressText={batchProgressText}
      />

      {/* ── Dialog Xác nhận Hủy Phân Ca ── */}
      <Dialog
        open={!!assignmentToDelete}
        onOpenChange={(open) => !open && setAssignmentToDelete(null)}
      >
        <DialogContent className="sm:max-w-md" data-testid="delete-assignment-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Xác nhận hủy phân ca</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Bạn có chắc chắn muốn hủy phân ca{' '}
              <span className="font-semibold text-slate-900">{assignmentToDelete?.shiftName}</span> của nhân viên{' '}
              <span className="font-semibold text-slate-900">{assignmentToDelete?.fullName}</span>? Thao tác này sẽ gỡ nhân viên khỏi ca làm việc đã chọn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAssignmentToDelete(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              isLoading={deletingAssignmentId === assignmentToDelete?.id}
              data-testid="confirm-remove-assignment-btn"
              onClick={confirmRemoveAssignment}
            >
              Hủy phân ca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
