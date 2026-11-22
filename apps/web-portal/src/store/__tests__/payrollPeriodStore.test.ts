/**
 * Unit Tests cho PayrollPeriodStore
 * (DTD-WEB-005, DATA-WEB-006, DD-WEB-006, BLD-WEB-025, TASK-WEB-022).
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePayrollPeriodStore, useIsAdjustmentLocked } from '../payrollPeriodStore'
import { safeLocalStorage, safeSessionStorage } from '@/services/storage'
import type { PayrollPeriodResponse } from '@/types'

const mockOpenPeriod: PayrollPeriodResponse = {
  id: 1,
  periodYear: 2026,
  periodMonth: 10,
  status: 'OPEN',
  createdAt: '2026-10-01T00:00:00.000+07:00',
}

const mockLockedPeriod: PayrollPeriodResponse = {
  id: 2,
  periodYear: 2026,
  periodMonth: 9,
  status: 'LOCKED',
  lockedByName: 'HR Manager',
  lockedAt: '2026-10-05T17:00:00.000+07:00',
  createdAt: '2026-09-01T00:00:00.000+07:00',
}

describe('PayrollPeriodStore (TASK-WEB-022)', () => {
  beforeEach(() => {
    usePayrollPeriodStore.getState().clearStore()
    safeLocalStorage.clear()
    safeSessionStorage.clear()
  })

  describe('1. Quản lý Kỳ công & Cờ Khóa Điều chỉnh (isAdjustmentLocked)', () => {
    it('cờ isAdjustmentLocked = false khi chọn kỳ công đang OPEN', () => {
      const store = usePayrollPeriodStore.getState()
      store.setSelectedPeriod(mockOpenPeriod)

      const state = usePayrollPeriodStore.getState()
      expect(state.selectedPeriod?.id).toBe(1)
      expect(state.isAdjustmentLocked).toBe(false)
    })

    it('cờ isAdjustmentLocked = true khi chọn kỳ công đã LOCKED (DTD-WEB-005)', () => {
      const store = usePayrollPeriodStore.getState()
      store.setSelectedPeriod(mockLockedPeriod)

      const state = usePayrollPeriodStore.getState()
      expect(state.selectedPeriod?.id).toBe(2)
      expect(state.isAdjustmentLocked).toBe(true)
    })

    it('selector useIsAdjustmentLocked phản ánh tức thì trạng thái khóa', () => {
      const { result } = renderHook(() => useIsAdjustmentLocked())

      expect(result.current).toBe(false)

      act(() => {
        usePayrollPeriodStore.getState().setSelectedPeriod(mockLockedPeriod)
      })

      expect(result.current).toBe(true)
    })
  })

  describe('2. Đồng bộ Danh sách & Cập nhật Trạng thái Thời gian thực', () => {
    it('setPeriods tự động chọn kỳ đầu tiên nếu chưa có kỳ nào được chọn', () => {
      const store = usePayrollPeriodStore.getState()
      store.setPeriods([mockLockedPeriod, mockOpenPeriod])

      const state = usePayrollPeriodStore.getState()
      expect(state.periods).toHaveLength(2)
      expect(state.selectedPeriod?.id).toBe(2)
      expect(state.isAdjustmentLocked).toBe(true)
    })

    it('updatePeriodStatus cập nhật trạng thái chốt kỳ và tự động đổi cờ isAdjustmentLocked', () => {
      const store = usePayrollPeriodStore.getState()
      store.setPeriods([mockOpenPeriod])
      expect(usePayrollPeriodStore.getState().isAdjustmentLocked).toBe(false)

      // Chốt kỳ công 1 (OPEN -> LOCKED)
      store.updatePeriodStatus(1, 'LOCKED', {
        lockedByName: 'Admin User',
        lockedAt: '2026-10-12T18:00:00.000+07:00',
      })

      const state = usePayrollPeriodStore.getState()
      expect(state.selectedPeriod?.status).toBe('LOCKED')
      expect(state.selectedPeriod?.lockedByName).toBe('Admin User')
      expect(state.isAdjustmentLocked).toBe(true)
    })
  })

  describe('3. Ràng buộc An toàn & Lưu trữ In-Memory (Done when)', () => {
    it('TUYỆT ĐỐI KHÔNG ghi cờ khóa kỳ công hoặc dữ liệu kỳ vào LocalStorage/SessionStorage', () => {
      const store = usePayrollPeriodStore.getState()
      store.setSelectedPeriod(mockLockedPeriod)
      store.setPeriods([mockLockedPeriod, mockOpenPeriod])

      // Kiểm tra tiêu chí Done when: cờ khóa kỳ công không ghi LocalStorage
      expect(safeLocalStorage.getItem('payroll_period')).toBeNull()
      expect(safeLocalStorage.getItem('fas_payroll_period')).toBeNull()
      expect(safeLocalStorage.getItem('isAdjustmentLocked')).toBeNull()
      expect(safeLocalStorage.getItem('fas_adjustment_locked')).toBeNull()
      expect(safeSessionStorage.getItem('fas_payroll_period')).toBeNull()
    })

    it('clearStore dọn sạch dữ liệu kỳ công khỏi bộ nhớ', () => {
      const store = usePayrollPeriodStore.getState()
      store.setSelectedPeriod(mockLockedPeriod)

      store.clearStore()
      const state = usePayrollPeriodStore.getState()
      expect(state.selectedPeriod).toBeNull()
      expect(state.periods).toEqual([])
      expect(state.isAdjustmentLocked).toBe(false)
    })
  })
})
