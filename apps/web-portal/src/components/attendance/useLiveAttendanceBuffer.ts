/**
 * useLiveAttendanceBuffer: Custom hook đóng gói logic STOMP thời gian thực,
 * buffer bản ghi chờ khi tạm dừng live, và hiệu ứng Green Flash (ARCH-02, BLD-WEB-015, DD-WEB-014).
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useLiveAttendance } from '@/services/hooks/useLiveAttendance'
import type { AttendanceRecord } from '@/types'

export interface UseLiveAttendanceBufferOptions {
  filterPredicate?: (record: AttendanceRecord) => boolean
  onStatsIncrement?: (record: AttendanceRecord) => void
  onRecordAdded?: () => void
}

export function useLiveAttendanceBuffer(options: UseLiveAttendanceBufferOptions = {}) {
  const { filterPredicate, onStatsIncrement, onRecordAdded } = options

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isLiveEnabled, setIsLiveEnabled] = useState<boolean>(true)
  const [pendingLiveCount, setPendingLiveCount] = useState<number>(0)
  const pendingRecordsRef = useRef<AttendanceRecord[]>([])

  const [highlightedRecordId, setHighlightedRecordId] = useState<number | null>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lưu mutable ref của filterPredicate để tránh re-subcribe WebSocket
  const filterPredicateRef = useRef(filterPredicate)
  useEffect(() => {
    filterPredicateRef.current = filterPredicate
  }, [filterPredicate])

  const handleStompRecordReceived = useCallback(
    (newRecord: AttendanceRecord) => {
      // 1. Tự động tăng bộ đếm thống kê
      onStatsIncrement?.(newRecord)

      // 2. Kiểm tra bộ lọc hiện hành
      if (filterPredicateRef.current && !filterPredicateRef.current(newRecord)) {
        return
      }

      // 3. Nếu chế độ Live đang Bật -> Chèn trực tiếp lên đầu bảng (Optimistic Prepend)
      if (isLiveEnabled) {
        setRecords((prev) => {
          const existingFiltered = prev.filter((r) => r.recordId !== newRecord.recordId)
          return [newRecord, ...existingFiltered].slice(0, 100)
        })
        onRecordAdded?.()

        // Kích hoạt hiệu ứng Green Flash 3 giây trên dòng mới nhất (BLD-WEB-015)
        setHighlightedRecordId(newRecord.recordId)
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedRecordId((current) =>
            current === newRecord.recordId ? null : current
          )
        }, 3000)
      } else {
        // Nếu Live Mode đang Tắt -> Lưu vào danh sách chờ
        pendingRecordsRef.current = [newRecord, ...pendingRecordsRef.current]
        setPendingLiveCount((c) => c + 1)
      }
    },
    [isLiveEnabled, onStatsIncrement, onRecordAdded]
  )

  // Kết nối WebSocket STOMP
  const { isConnected } = useLiveAttendance({
    onRecordReceived: handleStompRecordReceived,
  })

  // Dọn dẹp timer khi component unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  // Xả các bản ghi đang chờ vào bảng khi bật lại Live Mode hoặc click badge
  const flushPendingRecords = useCallback(() => {
    if (pendingRecordsRef.current.length > 0) {
      const pending = [...pendingRecordsRef.current]
      pendingRecordsRef.current = []
      setPendingLiveCount(0)

      setRecords((prev) => {
        const map = new Map<number, AttendanceRecord>()
        for (const item of [...pending, ...prev]) {
          map.set(item.recordId, item)
        }
        return Array.from(map.values()).slice(0, 100)
      })

      // Highlight bản ghi mới nhất trong 3 giây
      if (pending[0]) {
        setHighlightedRecordId(pending[0].recordId)
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedRecordId(null)
        }, 3000)
      }
    }
  }, [])

  const handleToggleLiveMode = useCallback(() => {
    if (!isLiveEnabled) {
      flushPendingRecords()
      setIsLiveEnabled(true)
    } else {
      setIsLiveEnabled(false)
    }
  }, [isLiveEnabled, flushPendingRecords])

  return {
    records,
    setRecords,
    isLiveEnabled,
    setIsLiveEnabled,
    pendingLiveCount,
    flushPendingRecords,
    handleToggleLiveMode,
    highlightedRecordId,
    isConnected,
  }
}
