/**
 * Màn hình Quản lý Danh mục Ca làm việc & Phân ca Nhân sự
 * (SOL-WEB-007, BLD-WEB-019, UXD-WEB-006, FR-WEB-008, TASK-WEB-025, ARCH-W-01).
 *
 * - Presenter view kết nối useAdminShiftManagement hook (Container/Presenter pattern).
 * - Quản lý CRUD ca làm việc (Shift Catalog): Tạo mới, sửa giờ, ân hạn, đổi trạng thái.
 * - Phân ca nhân sự theo khoảng ngày hiệu lực (Shift Assignment).
 */

import React from 'react'
import { Calendar, Clock } from 'lucide-react'
import {
  WeeklyShiftScheduleView,
  ShiftFormDrawer,
  AssignShiftDrawer,
  ShiftCatalogTable,
  ShiftAssignmentToolbar,
  ShiftAssignmentTable,
  ShiftPayrollLockedBanner,
  ShiftManagementHeader,
  ShiftNotificationBanner,
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
    isSubmittingShift,
    isAssignDrawerOpen,
    setIsAssignDrawerOpen,
    assignFormData,
    setAssignFormData,
    assignFormError,
    overlapConflict,
    isSubmittingAssign,
    batchProgressText,
    notification,
    setNotification,
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

      <ShiftNotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />

      {/* ── Tabs Chuyển đổi Đồng bộ ── */}
      <div className="border-b border-border-subtle flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          data-testid="tab-shifts-btn"
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
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
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          data-testid="tab-assignments-btn"
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 border-b-2 cursor-pointer ${
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
        </button>
      </div>

      {/* ── Nội dung Tab 1: Danh mục Ca làm việc (ARCH-001 Subcomponent) ── */}
      {activeTab === 'shifts' && (
        <ShiftCatalogTable
          shifts={shifts}
          isLoadingShifts={isLoadingShifts}
          isAdjustmentLocked={isAdjustmentLocked}
          togglingShiftId={togglingShiftId}
          onEditShift={handleOpenEditShiftDrawer}
          onToggleShiftActive={handleToggleShiftActive}
        />
      )}

      {/* ── Nội dung Tab 2: Lịch Phân ca Nhân sự (ARCH-001 Subcomponents) ── */}
      {activeTab === 'assignments' && (
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
      )}

      <ShiftFormDrawer
        isOpen={isShiftDrawerOpen}
        onClose={() => setIsShiftDrawerOpen(false)}
        editingShift={editingShift}
        formData={shiftFormData}
        onChangeFormData={setShiftFormData}
        formError={shiftFormError}
        isSubmitting={isSubmittingShift}
        onSubmit={handleSaveShift}
      />

      <AssignShiftDrawer
        isOpen={isAssignDrawerOpen}
        onClose={() => setIsAssignDrawerOpen(false)}
        formData={assignFormData}
        onChangeFormData={setAssignFormData}
        formError={assignFormError}
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
    </div>
  )
}
