/**
 * PayrollPeriodStore (DTD-WEB-005, DATA-WEB-006, DD-WEB-006, BLD-WEB-025, TASK-WEB-022).
 *
 * Quản lý trạng thái kỳ công và cờ khóa điều chỉnh phía Client:
 * - Lưu trữ thuần túy In-Memory (TUYỆT ĐỐI KHÔNG ghi LocalStorage/SessionStorage)
 *   để tránh dữ liệu kỳ công cũ bị kẹt trên máy trạm gây sai lệch phân quyền.
 * - Cung cấp cờ `isAdjustmentLocked` và selector dùng chung để tự động vô hiệu hóa
 *   các nút thao tác sửa đổi dữ liệu (duyệt đơn, phân ca, sửa giờ điểm danh) trên toàn bộ giao diện.
 */

import { create } from 'zustand'
import type { PayrollPeriodResponse, PayrollPeriodStatus } from '@/types'

export interface PayrollPeriodState {
  selectedPeriod: PayrollPeriodResponse | null
  periods: PayrollPeriodResponse[]
  isAdjustmentLocked: boolean

  // Actions
  setSelectedPeriod: (period: PayrollPeriodResponse | null) => void
  setPeriods: (periods: PayrollPeriodResponse[]) => void
  updatePeriodStatus: (
    periodId: number,
    status: PayrollPeriodStatus,
    lockDetails?: { lockedByName?: string | null; lockedAt?: string | null }
  ) => void
  clearStore: () => void
}

export const usePayrollPeriodStore = create<PayrollPeriodState>((set, get) => ({
  selectedPeriod: null,
  periods: [],
  isAdjustmentLocked: false,

  /**
   * Thiết lập kỳ công đang được quản trị viên/nhân viên lựa chọn.
   * Cờ `isAdjustmentLocked` tự động được tính toán: true nếu trạng thái kỳ là 'LOCKED'.
   */
  setSelectedPeriod: (period: PayrollPeriodResponse | null) => {
    set({
      selectedPeriod: period,
      isAdjustmentLocked: period?.status === 'LOCKED',
    })
  },

  /**
   * Cập nhật toàn bộ danh sách kỳ công từ API máy chủ
   */
  setPeriods: (periods: PayrollPeriodResponse[]) => {
    const currentSelected = get().selectedPeriod
    let updatedSelected = currentSelected

    // Nếu kỳ hiện tại đang chọn nằm trong danh sách mới, cập nhật lại dữ liệu mới nhất
    if (currentSelected) {
      const matched = periods.find((p) => p.id === currentSelected.id)
      if (matched) {
        updatedSelected = matched
      }
    } else if (periods.length > 0) {
      // Mặc định chọn kỳ gần nhất nếu chưa chọn
      updatedSelected = periods[0]
    }

    set({
      periods,
      selectedPeriod: updatedSelected,
      isAdjustmentLocked: updatedSelected?.status === 'LOCKED',
    })
  },

  /**
   * Cập nhật trạng thái chốt/mở kỳ công thời gian thực (ví dụ sau khi HR bấm Chốt kỳ)
   */
  updatePeriodStatus: (
    periodId: number,
    status: PayrollPeriodStatus,
    lockDetails?: { lockedByName?: string | null; lockedAt?: string | null }
  ) => {
    set((state) => {
      const updatedPeriods = state.periods.map((p) => {
        if (p.id !== periodId) return p
        return {
          ...p,
          status,
          lockedByName: lockDetails?.lockedByName ?? p.lockedByName,
          lockedAt: lockDetails?.lockedAt ?? p.lockedAt,
        }
      })

      let updatedSelected = state.selectedPeriod
      if (state.selectedPeriod?.id === periodId) {
        updatedSelected = {
          ...state.selectedPeriod,
          status,
          lockedByName: lockDetails?.lockedByName ?? state.selectedPeriod.lockedByName,
          lockedAt: lockDetails?.lockedAt ?? state.selectedPeriod.lockedAt,
        }
      }

      return {
        periods: updatedPeriods,
        selectedPeriod: updatedSelected,
        isAdjustmentLocked: updatedSelected?.status === 'LOCKED',
      }
    })
  },

  /**
   * Xóa sạch dữ liệu kỳ công khỏi bộ nhớ RAM
   */
  clearStore: () => {
    set({
      selectedPeriod: null,
      periods: [],
      isAdjustmentLocked: false,
    })
  },
}))

/**
 * Selector tiện ích kiểm tra nhanh xem kỳ công hiện tại có đang bị khóa điều chỉnh hay không
 */
export function useIsAdjustmentLocked(): boolean {
  return usePayrollPeriodStore((state) => state.isAdjustmentLocked)
}
