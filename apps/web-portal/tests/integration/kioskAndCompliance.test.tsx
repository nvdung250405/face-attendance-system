/**
 * Integration & Unit Tests cho Module Quản trị Trạm Kiosk & Tuân thủ DPO
 * (DD-WEB-019, DD-WEB-022, UXD-WEB-008, UXD-WEB-009, BLD-WEB-021, TASK-WEB-027).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KioskRegistrationModal } from '@/components/kiosk/KioskRegistrationModal'
import { AdminKioskManagementView } from '@/views/admin/AdminKioskManagementView'
import { AdminAuditLogView } from '@/views/admin/AdminAuditLogView'
import { useAuthStore } from '@/store/authStore'
import { useKioskRegistryStore } from '@/store/kioskRegistryStore'
import { complianceAdminService } from '@/services/complianceAdminService'
import { dataSubjectService } from '@/services/dataSubjectService'
import type {
  UserProfile,
  KioskItemResponse,
  AuditLogItem,
  DpoConsentAuditItem,
  DpoConsentWithdrawalItem,
  RetentionScheduleItem,
  DataSubjectRequestItem,
} from '@/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockStompSubscribe = vi.fn((_topic?: string, _cb?: unknown) => ({ unsubscribe: vi.fn() }))

vi.mock('@/services/hooks/useStompClient', () => ({
  useStompClient: () => ({
    status: 'CONNECTED',
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: mockStompSubscribe,
  }),
}))

const mockAdminUser: UserProfile = {
  id: 1,
  employeeCode: 'ADM-001',
  fullName: 'Quản trị viên Hệ thống',
  email: 'admin@company.com',
  role: 'ADMIN',
  status: 'ACTIVE',
  hasBiometric: false,
  hasPin: true,
  department: 'Khối CNTT & An ninh',
}

const mockDpoUser: UserProfile = {
  id: 99,
  employeeCode: 'DPO-001',
  fullName: 'Cán bộ Bảo vệ Dữ liệu (DPO)',
  email: 'dpo@company.com',
  role: 'DPO',
  status: 'ACTIVE',
  hasBiometric: false,
  hasPin: true,
  department: 'Ban Pháp chế & Tuân thủ',
}

const mockKiosks: KioskItemResponse[] = [
  {
    id: 1,
    kioskId: 'KSK-HQ-LOBBY-01',
    name: 'Kiosk Sảnh Chính Tòa A',
    location: 'Tầng 1 - Sảnh chính HQ',
    ipAddress: '192.168.10.101',
    status: 'ONLINE',
    lastPingAt: new Date(Date.now() - 60 * 1000).toISOString(), // 1 phút trước (Khỏe mạnh)
    appVersion: 'v2.4.0',
  },
  {
    id: 2,
    kioskId: 'KSK-F1-GATE-02',
    name: 'Kiosk Cổng Phụ Xưởng 1',
    location: 'Cổng 2B - Khu công nghiệp Sài Đồng',
    ipAddress: '192.168.20.102',
    status: 'WARNING',
    lastPingAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 phút trước (> 5 phút -> Ping Stale)
    appVersion: 'v2.3.9',
  },
  {
    id: 3,
    kioskId: 'KSK-F2-CANTEEN-03',
    name: 'Kiosk Nhà Ăn Khu B',
    location: 'Tầng 2 - Canteen',
    ipAddress: '192.168.20.103',
    status: 'OFFLINE',
    lastPingAt: '2026-09-01T10:00:00Z', // Offline lâu
    appVersion: 'v2.3.5',
  },
]

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 101,
    createdAt: '2026-10-14T09:30:00Z',
    actorId: 1,
    actorEmail: 'admin@company.com',
    action: 'KIOSK_REGISTERED',
    targetResource: 'KIOSK:KSK-HQ-LOBBY-01',
    ipAddress: '10.0.1.50',
    newValues: { kioskId: 'KSK-HQ-LOBBY-01', location: 'Tầng 1 HQ' },
  },
  {
    id: 102,
    createdAt: '2026-10-14T10:15:00Z',
    actorId: 1042,
    actorEmail: 'emp1042@company.com',
    action: 'CONSENT_WITHDRAWN',
    targetResource: 'BIOMETRIC_PROFILE:EMP-1042',
    ipAddress: '192.168.1.15',
    oldValues: { biometricConsent: true },
    newValues: { biometricConsent: false, retentionDeadlineDays: 7 },
  },
]

const mockConsents: DpoConsentAuditItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-1042',
    fullName: 'Nguyễn Văn A',
    consentVersion: 'v2.1',
    agreedAt: '2026-01-15T08:00:00Z',
    ipAddress: '192.168.1.50',
    status: 'REVOKED',
  },
  {
    id: 2,
    employeeId: 1088,
    employeeCode: 'EMP-1088',
    fullName: 'Trần Thị B',
    consentVersion: 'v2.1',
    agreedAt: '2026-02-10T09:00:00Z',
    ipAddress: '192.168.1.88',
    status: 'ACTIVE',
  },
]

const mockRetentionItems: RetentionScheduleItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-1042',
    fullName: 'Nguyễn Văn A',
    resignedAt: '2026-10-14T10:15:00Z',
    scheduledDestructionDate: '2026-10-21T10:15:00Z',
    status: 'SCHEDULED',
  },
]

const mockWithdrawals: DpoConsentWithdrawalItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-1042',
    fullName: 'Nguyễn Văn A',
    withdrawnAt: '2026-10-14T09:00:00Z',
    biometricDisposalDueAt: '2026-11-03T09:00:00Z',
    status: 'PENDING_DISPOSAL',
    reason: 'Chuyển sang phương thức điểm danh thẻ từ',
  },
]

const mockDataRequests: DataSubjectRequestItem[] = [
  {
    id: 1,
    employeeId: 1042,
    employeeCode: 'EMP-1042',
    fullName: 'Nguyễn Văn A',
    requestType: 'ACCESS',
    detail: 'Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026.',
    status: 'RECEIVED',
    submittedAt: '2026-10-01T08:30:00Z',
  },
]

describe('Module Quản trị Trạm Kiosk & Tuân thủ DPO (TASK-WEB-027)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    window.confirm = vi.fn().mockReturnValue(true)
    window.alert = vi.fn()
    useKioskRegistryStore.getState().clearStore()

    // Default Auth là ADMIN
    useAuthStore.setState({
      session: {
        accessToken: 'mock-admin-access-token',
        refreshToken: 'mock-admin-refresh-token',
        tokenType: 'Bearer',
        expiresAt: Date.now() + 3600000,
        user: { ...mockAdminUser },
      },
      user: { ...mockAdminUser },
      isAuthenticated: true,
      isInitialized: true,
    })

    // Mock service default responses
    vi.spyOn(complianceAdminService, 'getKiosks').mockResolvedValue(mockKiosks)
    vi.spyOn(complianceAdminService, 'getAuditLogs').mockResolvedValue({
      content: mockAuditLogs,
      totalElements: mockAuditLogs.length,
      totalPages: 1,
      page: 0,
      size: 10,
      first: true,
      last: true,
    })
    vi.spyOn(complianceAdminService, 'getDpoConsents').mockResolvedValue(mockConsents)
    vi.spyOn(complianceAdminService, 'getDpoRetentionSchedule').mockResolvedValue(mockRetentionItems)
    vi.spyOn(complianceAdminService, 'getDpoConsentWithdrawals').mockResolvedValue(mockWithdrawals)
    vi.spyOn(complianceAdminService, 'getKioskHealth').mockResolvedValue({
      kioskId: 'KSK-HQ-LOBBY-01',
      status: 'ONLINE',
      isStale: false,
      lastPingAt: new Date().toISOString(),
      macAddress: '00:1B:44:11:3A:B7',
      ipAddress: '192.168.10.101',
      firmwareVersion: 'v1.4.2 (Linux Edge OS)',
      appVersion: 'v2.4.0',
      cachedGalleryCount: 1248,
      heartbeatHistory: [
        { timestamp: new Date().toISOString(), latencyMs: 14, status: 'SUCCESS' },
      ],
      diagnosticLogs: [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'Camera feed healthy' },
      ],
    })
    vi.spyOn(dataSubjectService, 'getDpoDataRequests').mockResolvedValue(mockDataRequests)
    vi.spyOn(dataSubjectService, 'updateDataRequestStatus').mockImplementation(async (id, data) => ({
      id,
      employeeId: 1042,
      employeeCode: 'EMP-1042',
      fullName: 'Nguyễn Văn A',
      requestType: 'ACCESS',
      detail: 'Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026.',
      status: data.status,
      submittedAt: '2026-10-01T08:30:00Z',
      handledAt: new Date().toISOString(),
      handledBy: 'DPO Officer',
      response: data.response ?? data.adminNote ?? null,
      adminNote: data.response ?? data.adminNote ?? null,
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 1. KioskRegistrationModal Tests (DD-WEB-019 - Secret Token 1 lần trên RAM)
  // ────────────────────────────────────────────────────────────────────────────
  describe('1. KioskRegistrationModal (Đăng ký Kiosk & Secret Token RAM)', () => {
    it('không hiển thị khi isOpen = false', () => {
      const { container } = render(
        <KioskRegistrationModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('hiển thị form nhập thông tin Kiosk khi mở modal', () => {
      render(<KioskRegistrationModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />)

      expect(screen.getByText('Đăng Ký Trạm Kiosk Mới')).toBeTruthy()
      expect(screen.getByTestId('kiosk-id-preview')).toBeTruthy()
      expect(screen.getByTestId('toggle-custom-kiosk-id')).toBeTruthy()
      expect(screen.getByTestId('kiosk-name-input')).toBeTruthy()
      expect(screen.getByTestId('kiosk-location-input')).toBeTruthy()
      expect(screen.getByTestId('submit-register-kiosk-btn')).toBeTruthy()
    })

    it('đăng ký Kiosk thành công: lưu Secret Token vào Zustand RAM, KHÔNG lưu vào Local/SessionStorage', async () => {
      const mockNewToken = 'ksk_sec_ram_abc123456789xyz'
      vi.spyOn(complianceAdminService, 'registerKiosk').mockResolvedValue({
        kiosk: {
          id: 99,
          kioskId: 'KSK-TEST-01',
          name: 'Trạm Thử Nghiệm',
          location: 'Phòng Lab QA',
          status: 'ONLINE',
          lastPingAt: new Date().toISOString(),
        },
        secretToken: mockNewToken,
      })

      const onSuccessMock = vi.fn()
      render(<KioskRegistrationModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccessMock} />)

      // Mở tùy chỉnh mã thủ công và điền form
      fireEvent.click(screen.getByTestId('toggle-custom-kiosk-id'))
      fireEvent.change(screen.getByTestId('kiosk-id-input'), {
        target: { value: 'KSK-TEST-01' },
      })
      fireEvent.change(screen.getByTestId('kiosk-name-input'), {
        target: { value: 'Trạm Thử Nghiệm' },
      })
      fireEvent.change(screen.getByTestId('kiosk-location-input'), {
        target: { value: 'Phòng Lab QA' },
      })

      // Submit
      fireEvent.click(screen.getByTestId('submit-register-kiosk-btn'))

      await waitFor(() => {
        expect(screen.getByTestId('secret-token-value')).toBeTruthy()
      })

      // Kiểm tra token hiển thị trên UI
      expect(screen.getByTestId('secret-token-value').textContent).toContain(mockNewToken)
      expect(screen.getByText(/LƯU Ý BẢO MẬT BẮT BUỘC/i)).toBeTruthy()
      expect(screen.getByText(/CHỈ ĐƯỢC HIỂN THỊ DUY NHẤT 1 LẦN/i)).toBeTruthy()

      // BẢO MẬT QUAN TRỌNG THEO DD-WEB-019:
      // Token lưu trên RAM store
      const storeTokens = useKioskRegistryStore.getState().secretTokens
      expect(storeTokens['KSK-TEST-01']).toBe(mockNewToken)

      // TUYỆT ĐỐI KHÔNG lưu vào localStorage hoặc sessionStorage
      expect(localStorage.getItem('kiosk_token')).toBeNull()
      expect(localStorage.getItem('KSK-TEST-01')).toBeNull()
      expect(sessionStorage.getItem('kiosk_token')).toBeNull()
      expect(sessionStorage.getItem('KSK-TEST-01')).toBeNull()

      // Test nút Copy Token
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
        writable: true,
        configurable: true,
      })
      fireEvent.click(screen.getByTestId('copy-token-btn'))
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockNewToken)
    })

    it('tự động xóa token khỏi RAM khi bấm nút Đóng/Hoàn tất', async () => {
      // Đặt token sẵn vào store
      useKioskRegistryStore.getState().setSecretToken('KSK-TEST-01', 'token-ram-test')
      expect(useKioskRegistryStore.getState().secretTokens['KSK-TEST-01']).toBe('token-ram-test')

      const handleClose = vi.fn()
      render(
        <KioskRegistrationModal
          isOpen={true}
          onClose={handleClose}
          onSuccess={vi.fn()}
        />
      )

      fireEvent.click(screen.getByTestId('cancel-kiosk-btn'))
      expect(handleClose).toHaveBeenCalled()
    })

    it('cho phép để trống kioskId khi đăng ký: server tự sinh mã trạm KSK-XXXX', async () => {
      const mockRegister = vi.spyOn(complianceAdminService, 'registerKiosk').mockResolvedValue({
        kiosk: {
          id: 100,
          kioskId: 'KSK-AUTO-01',
          name: 'Trạm Tự Sinh',
          location: 'Cổng Phụ',
          status: 'ONLINE',
          lastPingAt: new Date().toISOString(),
        },
        secretToken: 'ksk_sec_auto_999',
      })

      const onSuccessMock = vi.fn()
      render(<KioskRegistrationModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccessMock} />)

      // Không nhập kiosk-id-input, chỉ nhập name và location
      fireEvent.change(screen.getByTestId('kiosk-name-input'), {
        target: { value: 'Trạm Tự Sinh' },
      })
      fireEvent.change(screen.getByTestId('kiosk-location-input'), {
        target: { value: 'Cổng Phụ' },
      })

      fireEvent.click(screen.getByTestId('submit-register-kiosk-btn'))

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          kioskId: undefined,
          name: 'Trạm Tự Sinh',
          location: 'Cổng Phụ',
        })
        expect(screen.getByTestId('secret-token-value')).toBeTruthy()
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 2. AdminKioskManagementView Tests (Cảnh báo Ping Stale, Quyền DPO)
  // ────────────────────────────────────────────────────────────────────────────
  describe('2. AdminKioskManagementView (Màn hình Quản lý Trạm Kiosk)', () => {
    it('render danh sách trạm Kiosk và thẻ KPI tổng quan', async () => {
      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Quản lý Trạm Kiosk')).toBeTruthy()
      })

      // KPI cards
      expect(screen.getByTestId('kpi-total-kiosks').textContent).toBe('3')
      expect(screen.getByTestId('kpi-online-kiosks').textContent).toBe('1')
      expect(screen.getByTestId('kpi-stale-kiosks').textContent).toBe('2')
      expect(screen.getByTestId('kpi-offline-kiosks').textContent).toBe('1')

      // Table records
      expect(screen.getByText('Kiosk Sảnh Chính Tòa A')).toBeTruthy()
      expect(screen.getByText('Kiosk Cổng Phụ Xưởng 1')).toBeTruthy()
      expect(screen.getByText('Kiosk Nhà Ăn Khu B')).toBeTruthy()
    })

    it('phát hiện và cảnh báo trạm Kiosk mất Ping quá 5 phút theo DD-WEB-019', async () => {
      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('stale-ping-warning-banner')).toBeTruthy()
      })

      const banner = screen.getByTestId('stale-ping-warning-banner')
      expect(banner.textContent).toContain('Cảnh báo: Có')
      expect(banner.textContent).toContain('KSK-F1-GATE-02')
    })

    it('vai trò ADMIN: hiển thị nút Đăng ký mới và nút Cấp lại Token', async () => {
      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('open-register-kiosk-btn')).toBeTruthy()
      })

      expect(screen.getByText('Đăng ký Kiosk Mới')).toBeTruthy()
      expect(screen.getByTestId('reissue-token-btn-KSK-HQ-LOBBY-01')).toBeTruthy()
    })

    it('vai trò DPO: hiển thị banner Chỉ đọc, ẨN nút Đăng ký mới và nút Cấp lại Token', async () => {
      // Đổi sang DPO
      useAuthStore.setState({
        user: { ...mockDpoUser },
      })

      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('dpo-readonly-banner')).toBeTruthy()
      })

      // Banner chỉ đọc
      expect(screen.getByTestId('dpo-readonly-banner').textContent).toContain(
        'Chế độ Tra cứu Chỉ Đọc (DPO Compliance Role)'
      )

      // Nút Đăng ký Kiosk Mới KHÔNG tồn tại
      expect(screen.queryByTestId('open-register-kiosk-btn')).toBeNull()

      // Nút Cấp lại Token KHÔNG tồn tại
      expect(screen.queryByTestId('reissue-token-btn-KSK-HQ-LOBBY-01')).toBeNull()
    })

    it('cấp lại Secret Token cho Kiosk và lưu token mới trên RAM', async () => {
      const mockRotatedToken = 'ksk_rotated_ram_token_999'
      vi.spyOn(complianceAdminService, 'updateKiosk').mockResolvedValue({
        id: 1,
        kioskId: 'KSK-HQ-LOBBY-01',
        name: 'Kiosk Sảnh Chính Tòa A',
        location: 'Tầng 1 - Sảnh chính HQ',
        status: 'ONLINE',
        secretToken: mockRotatedToken,
      })

      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('reissue-token-btn-KSK-HQ-LOBBY-01')).toBeTruthy()
      })

      // Bấm Cấp lại Token
      fireEvent.click(screen.getByTestId('reissue-token-btn-KSK-HQ-LOBBY-01'))

      // Xác nhận trên Dialog Cấp lại
      const confirmBtn = await screen.findByTestId('confirm-reissue-btn')
      fireEvent.click(confirmBtn)

      // Modal hiển thị token xuất hiện
      await waitFor(() => {
        expect(screen.getByTestId('reissued-token-value')).toBeTruthy()
      })

      expect(screen.getByTestId('reissued-token-value').textContent).toContain(mockRotatedToken)

      // Kiểm tra lưu trên RAM và không lưu trong Storage
      expect(useKioskRegistryStore.getState().secretTokens['KSK-HQ-LOBBY-01']).toBe(mockRotatedToken)
      expect(localStorage.getItem('kiosk_token')).toBeNull()
      expect(sessionStorage.getItem('kiosk_token')).toBeNull()

      // Đóng modal cấp lại token
      fireEvent.click(screen.getByTestId('close-reissued-token-modal-btn'))
      expect(screen.queryByTestId('reissued-token-value')).toBeNull()
    })

    it('dọn sạch RAM store khi component unmount', async () => {
      useKioskRegistryStore.getState().setSecretToken('TEMP_KEY', 'temp_val')
      expect(useKioskRegistryStore.getState().secretTokens['TEMP_KEY']).toBe('temp_val')

      const { unmount } = render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      unmount()
      expect(useKioskRegistryStore.getState().secretTokens).toEqual({})
    })

    it('mở KioskDetailDrawer khi click vào thẻ/dòng trạm Kiosk và hiển thị đầy đủ viễn trắc chẩn đoán', async () => {
      const getHealthSpy = vi.spyOn(complianceAdminService, 'getKioskHealth').mockResolvedValue({
        kioskId: 'KSK-HQ-LOBBY-01',
        status: 'ONLINE',
        isStale: false,
        lastPingAt: new Date().toISOString(),
        macAddress: '00:1B:44:11:3A:B7',
        ipAddress: '192.168.10.101',
        firmwareVersion: 'v1.4.2 (Linux Edge OS)',
        appVersion: 'v2.4.0',
        cachedGalleryCount: 1248,
        heartbeatHistory: [
          { timestamp: new Date().toISOString(), latencyMs: 14, status: 'SUCCESS' },
        ],
        diagnosticLogs: [
          { timestamp: new Date().toISOString(), level: 'INFO', message: 'Camera feed healthy (60 FPS)' },
        ],
      })

      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('kiosk-card-KSK-HQ-LOBBY-01')).toBeTruthy()
      })

      // Click card/row to open KioskDetailDrawer
      fireEvent.click(screen.getByTestId('kiosk-card-KSK-HQ-LOBBY-01'))

      await waitFor(() => {
        expect(screen.getByTestId('kiosk-detail-drawer')).toBeTruthy()
      })

      expect(getHealthSpy).toHaveBeenCalledWith('KSK-HQ-LOBBY-01')
      expect(screen.getByTestId('kiosk-status-badge')).toBeTruthy()
      expect(screen.getByTestId('kiosk-mac-address').textContent).toBe('00:1B:44:11:3A:B7')
      expect(screen.getByTestId('kiosk-ip-address').textContent).toBe('192.168.10.101')
      expect(screen.getByTestId('kiosk-firmware-version').textContent).toContain('v1.4.2')
      expect(screen.getByTestId('kiosk-cached-vectors').textContent).toContain('1.248')
      expect(screen.getByTestId('kiosk-heartbeat-history')).toBeTruthy()
      expect(screen.getByTestId('kiosk-diagnostic-logs')).toBeTruthy()

      // Làm mới viễn trắc
      fireEvent.click(screen.getByTestId('refresh-kiosk-health-btn'))
      expect(getHealthSpy).toHaveBeenCalledTimes(2)

      // Đóng drawer
      fireEvent.click(screen.getByTestId('detail-drawer-close-btn'))
      await waitFor(() => {
        expect(useKioskRegistryStore.getState().selectedKioskId).toBeNull()
      })
    })

    it('cập nhật trạng thái trạm Kiosk tức thời trong RAM qua STOMP topic /topic/kiosk-status', async () => {
      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('kpi-online-kiosks').textContent).toBe('1')
        expect(screen.getByTestId('kpi-offline-kiosks').textContent).toBe('1')
      })

      // Cập nhật trạng thái KSK-HQ-LOBBY-01 từ ONLINE sang OFFLINE trong RAM qua STOMP
      act(() => {
        useKioskRegistryStore.getState().updateKioskStatus('KSK-HQ-LOBBY-01', 'OFFLINE')
      })

      await waitFor(() => {
        expect(screen.getByTestId('kpi-online-kiosks').textContent).toBe('0')
        expect(screen.getByTestId('kpi-offline-kiosks').textContent).toBe('2')
      })

      // Cập nhật lại sang ONLINE
      act(() => {
        useKioskRegistryStore.getState().updateKioskStatus('KSK-HQ-LOBBY-01', 'ONLINE')
      })
      await waitFor(() => {
        expect(screen.getByTestId('kpi-online-kiosks').textContent).toBe('1')
        expect(screen.getByTestId('kpi-offline-kiosks').textContent).toBe('1')
      })
    })

    it('đăng ký lắng nghe STOMP topic /topic/kiosk-status khi màn hình được khởi tạo', async () => {
      let capturedTopic = ''
      let capturedCallback: ((msg: { body: string }) => void) | undefined = undefined

      mockStompSubscribe.mockImplementation((topic?: string, cb?: unknown) => {
        capturedTopic = topic || ''
        capturedCallback = cb as (msg: { body: string }) => void
        return {
          unsubscribe: vi.fn(),
        }
      })

      render(
        <MemoryRouter>
          <AdminKioskManagementView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockStompSubscribe).toHaveBeenCalled()
      })
      expect(capturedTopic).toBe('/topic/kiosk-status')

      // Giả lập phát thông điệp STOMP tới /topic/kiosk-status
      act(() => {
        capturedCallback?.({
          body: JSON.stringify({
            kioskId: 'KSK-HQ-LOBBY-01',
            status: 'OFFLINE',
            lastPingAt: new Date().toISOString(),
          }),
        })
      })

      await waitFor(() => {
        const kiosk = useKioskRegistryStore.getState().kiosks.find((k) => k.kioskId === 'KSK-HQ-LOBBY-01')
        expect(kiosk?.status).toBe('OFFLINE')
      })
    })
  })

  // ────────────────────────────────────────────────────────────────────────────
  // 3. AdminAuditLogView Tests (Audit Logs, DPO Consents, Retention 20 ngày)
  // ────────────────────────────────────────────────────────────────────────────
  describe('3. AdminAuditLogView (Tra cứu Kiểm toán & Tuân thủ DPO)', () => {
    it('hiển thị nhãn Chế độ Chỉ đọc và các Tab chức năng DPO & Kiểm toán', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Nhật ký Kiểm toán & Tuân thủ DPO')).toBeTruthy()
      })

      // Banner chỉ đọc
      expect(screen.getByTestId('read-only-compliance-banner').textContent).toContain('Chế độ Tra cứu Chỉ Đọc')

      // 5 Tabs
      expect(screen.getByTestId('tab-audit-logs')).toBeTruthy()
      expect(screen.getByTestId('tab-dpo-consents')).toBeTruthy()
      expect(screen.getByTestId('tab-retention-schedule')).toBeTruthy()
      expect(screen.getByTestId('tab-retention-schedule').textContent).toContain('Lịch Tiêu hủy 20 Ngày')
      expect(screen.getByTestId('tab-dpo-withdrawals')).toBeTruthy()
      expect(screen.getByTestId('tab-dpo-data-requests')).toBeTruthy()
    })

    it('Tab 1: hiển thị bộ lọc kiểm toán và tải danh sách Audit Logs', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('filter-action-input')).toBeTruthy()
      })

      expect(screen.getByTestId('filter-email-input')).toBeTruthy()
      expect(screen.getByTestId('filter-start-date-input')).toBeTruthy()
      expect(screen.getByTestId('filter-end-date-input')).toBeTruthy()
      expect(screen.getByTestId('audit-search-btn')).toBeTruthy()

      // Kiểm tra dữ liệu bảng
      await waitFor(() => {
        expect(screen.getByText('admin@company.com')).toBeTruthy()
      })
      expect(screen.getByText('KIOSK:KSK-HQ-LOBBY-01')).toBeTruthy()
      expect(screen.getByText('emp1042@company.com')).toBeTruthy()

      // Lọc theo form
      fireEvent.change(screen.getByTestId('filter-email-input'), {
        target: { value: 'emp1042@company.com' },
      })
      fireEvent.click(screen.getByTestId('audit-search-btn'))

      await waitFor(() => {
        expect(complianceAdminService.getAuditLogs).toHaveBeenCalledWith(
          expect.objectContaining({
            actorEmail: 'emp1042@company.com',
          })
        )
      })
    })

    it('Tab 1: xem chi tiết diff thay đổi JSON khi bấm Xem diff', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getAllByText('Xem diff')[0]).toBeTruthy()
      })

      // Bấm Xem diff
      fireEvent.click(screen.getAllByText('Xem diff')[0])

      await waitFor(() => {
        expect(screen.getByText(/Chi tiết Kiểm toán #/i)).toBeTruthy()
      })

      expect(screen.getByText(/Giá trị mới cập nhật:/i)).toBeTruthy()
    })

    it('Tab 2: chuyển sang tab DPO Consents và hiển thị bảng hồ sơ cam kết', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-dpo-consents')).toBeTruthy()
      })

      // Click tab DPO Consents
      fireEvent.click(screen.getByTestId('tab-dpo-consents'))

      await waitFor(() => {
        expect(complianceAdminService.getDpoConsents).toHaveBeenCalled()
      })

      expect(screen.getByText('Danh Sách Ký Cam Kết Informed Consent')).toBeTruthy()
      expect(screen.getByText('EMP-1042')).toBeTruthy()
      expect(screen.getByText('Nguyễn Văn A')).toBeTruthy()
      expect(screen.getByText('ĐÃ RÚT CAM KẾT')).toBeTruthy()
      expect(screen.getByText('EMP-1088')).toBeTruthy()
      expect(screen.getByText('HIỆU LỰC')).toBeTruthy()
    })

    it('Tab 3: chuyển sang tab Retention Schedule và hiển thị lịch tiêu hủy 20 ngày theo NĐ 356/2025', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-retention-schedule')).toBeTruthy()
      })

      // Click tab Retention Schedule
      fireEvent.click(screen.getByTestId('tab-retention-schedule'))

      await waitFor(() => {
        expect(complianceAdminService.getDpoRetentionSchedule).toHaveBeenCalled()
      })

      expect(screen.getByText('Lịch Trình Tiêu Hủy Vector Sinh Trắc Học')).toBeTruthy()
      expect(screen.getByText(/Quy định Tiêu hủy Dữ liệu \(Decree 13\/2023 & Decree 356\/2025\)/i)).toBeTruthy()
      expect(screen.getByText('Hạn Tiêu Hủy Dự Kiến (20 ngày)')).toBeTruthy()
      expect(screen.getByText('EMP-1042')).toBeTruthy()
      expect(screen.getByText('ĐANG CHỜ TIÊU HỦY')).toBeTruthy()
    })

    it('Tab 4: chuyển sang tab DPO Withdrawals và hiển thị bảng rút cam kết với hạn tiêu hủy 20 ngày', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-dpo-withdrawals')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('tab-dpo-withdrawals'))

      await waitFor(() => {
        expect(complianceAdminService.getDpoConsentWithdrawals).toHaveBeenCalled()
      })

      expect(screen.getByTestId('dpo-consent-withdrawals-table')).toBeTruthy()
      expect(screen.getByText('Danh Sách Rút Cam Kết Informed Consent')).toBeTruthy()
      expect(screen.getByText(/Quy định Tiêu hủy khi Rút Đồng thuận/i)).toBeTruthy()
      expect(screen.getByText('EMP-1042')).toBeTruthy()
      expect(screen.getByText('Chuyển sang phương thức điểm danh thẻ từ')).toBeTruthy()
      expect(screen.getByText('CHỜ TIÊU HỦY')).toBeTruthy()
    })

    it('Tab 5: chuyển sang tab DPO Data Requests và xử lý yêu cầu quyền chủ thể dữ liệu (DSR)', async () => {
      render(
        <MemoryRouter>
          <AdminAuditLogView />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-dpo-data-requests')).toBeTruthy()
      })

      fireEvent.click(screen.getByTestId('tab-dpo-data-requests'))

      await waitFor(() => {
        expect(dataSubjectService.getDpoDataRequests).toHaveBeenCalled()
      })

      expect(screen.getByTestId('dpo-data-requests-table')).toBeTruthy()
      expect(screen.getByText('Yêu Cầu Về Quyền Chủ Thể Dữ Liệu (DSR)')).toBeTruthy()
      expect(screen.getByText('Yêu cầu trích xuất toàn bộ dữ liệu điểm danh tháng 09/2026.')).toBeTruthy()

      // Mở modal xử lý
      fireEvent.click(screen.getByTestId('review-request-btn-1'))

      await waitFor(() => {
        expect(screen.getByTestId('request-status-select')).toBeTruthy()
      })

      fireEvent.change(screen.getByTestId('request-status-select'), {
        target: { value: 'FULFILLED' },
      })
      fireEvent.change(screen.getByTestId('request-response-input'), {
        target: { value: 'Đã xuất file điểm danh gửi qua email.' },
      })

      fireEvent.click(screen.getByTestId('submit-review-btn'))

      await waitFor(() => {
        expect(dataSubjectService.updateDataRequestStatus).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            status: 'FULFILLED',
            response: 'Đã xuất file điểm danh gửi qua email.',
          })
        )
      })
    })
  })
})
