/**
 * Zustand store theo dõi trạng thái kết nối STOMP WebSocket (TASK-WEB-009).
 *
 * Trạng thái được cập nhật bởi useStompWebSocket hook khi kết nối thay đổi.
 * TopHeader đọc store này để hiển thị chỉ báo kết nối Kiosk Live.
 */

import { create } from 'zustand'

export type StompStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

export interface StompConnectionState {
  status: StompStatus
  setStatus: (status: StompStatus) => void
}

export const useStompConnectionStore = create<StompConnectionState>((set) => ({
  status: 'DISCONNECTED',
  setStatus: (status) => set({ status }),
}))
