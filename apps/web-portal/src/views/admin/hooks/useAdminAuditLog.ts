/**
 * Custom hook quản lý trạng thái, bộ lọc và truy vấn nhật ký kiểm toán & tuân thủ DPO
 * (SOL-WEB-012, UI-WEB-012, UXD-WEB-007, APD-WEB-011, BLD-WEB-021, TASK-WEB-027, ARCH-W-01).
 */

import { useState, useEffect, useCallback } from 'react'
import { complianceAdminService } from '@/services/complianceAdminService'
import type {
  AuditLogItem,
  DpoConsentAuditItem,
  RetentionScheduleItem,
  AuditLogQueryCriteria,
} from '@/types'

export type ComplianceTab = 'AUDIT_LOGS' | 'DPO_CONSENTS' | 'RETENTION_SCHEDULE'

export const useAdminAuditLog = () => {
  const [activeTab, setActiveTab] = useState<ComplianceTab>('AUDIT_LOGS')

  // Tab 1: Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [isAuditLoading, setIsAuditLoading] = useState(true)
  const [auditTotal, setAuditTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  // Tab 2: DPO Consents state
  const [dpoConsents, setDpoConsents] = useState<DpoConsentAuditItem[]>([])
  const [isConsentsLoading, setIsConsentsLoading] = useState(false)

  // Tab 3: Retention Schedule state
  const [retentionItems, setRetentionItems] = useState<RetentionScheduleItem[]>([])
  const [isRetentionLoading, setIsRetentionLoading] = useState(false)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedLogDetail, setSelectedLogDetail] = useState<AuditLogItem | null>(null)

  // 1. Tải Audit Logs
  const loadAuditLogs = useCallback(
    async (
      targetPage = 0,
      targetPageSize = 20,
      criteriaOverrides?: Partial<AuditLogQueryCriteria>
    ) => {
      try {
        setIsAuditLoading(true)
        setErrorMessage(null)
        const criteria: AuditLogQueryCriteria = {
          page: targetPage,
          size: targetPageSize,
          action:
            (criteriaOverrides?.action !== undefined ? criteriaOverrides.action : filterAction).trim() ||
            undefined,
          actorEmail:
            (criteriaOverrides?.actorEmail !== undefined ? criteriaOverrides.actorEmail : filterEmail).trim() ||
            undefined,
          startDate:
            criteriaOverrides?.startDate !== undefined ? criteriaOverrides.startDate : (filterStartDate || undefined),
          endDate:
            criteriaOverrides?.endDate !== undefined ? criteriaOverrides.endDate : (filterEndDate || undefined),
          ...criteriaOverrides,
        }
        const data = await complianceAdminService.getAuditLogs(criteria)
        setAuditLogs(data.content)
        setAuditTotal(data.totalElements)
        setTotalPages(data.totalPages || 1)
        setPage(targetPage)
        setPageSize(targetPageSize)
      } catch (err) {
        const error = err as { message?: string }
        setErrorMessage(error.message || 'Không thể tải nhật ký kiểm toán.')
      } finally {
        setIsAuditLoading(false)
      }
    },
    [filterAction, filterEmail, filterStartDate, filterEndDate]
  )

  // 2. Tải DPO Consents
  const loadDpoConsents = useCallback(async () => {
    try {
      setIsConsentsLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoConsents()
      setDpoConsents(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải danh sách cam kết DPO.')
    } finally {
      setIsConsentsLoading(false)
    }
  }, [])

  // 3. Tải Retention Schedule
  const loadRetentionSchedule = useCallback(async () => {
    try {
      setIsRetentionLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoRetentionSchedule()
      setRetentionItems(data)
    } catch (err) {
      const error = err as { message?: string }
      setErrorMessage(error.message || 'Không thể tải lịch trình tiêu hủy dữ liệu.')
    } finally {
      setIsRetentionLoading(false)
    }
  }, [])

  // Tải dữ liệu ban đầu
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAuditLogs(0, 20)
  }, [loadAuditLogs])

  const handleTabChange = (tab: ComplianceTab) => {
    setActiveTab(tab)
    if (tab === 'AUDIT_LOGS' && auditLogs.length === 0) {
      loadAuditLogs(page, pageSize)
    } else if (tab === 'DPO_CONSENTS' && dpoConsents.length === 0) {
      loadDpoConsents()
    } else if (tab === 'RETENTION_SCHEDULE' && retentionItems.length === 0) {
      loadRetentionSchedule()
    }
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadAuditLogs(0, pageSize, {
      action: filterAction.trim() || undefined,
      actorEmail: filterEmail.trim() || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
    })
  }

  const handleResetFilter = () => {
    setFilterAction('')
    setFilterEmail('')
    setFilterStartDate('')
    setFilterEndDate('')
    loadAuditLogs(0, pageSize, {
      action: '',
      actorEmail: '',
      startDate: '',
      endDate: '',
    })
  }

  return {
    activeTab,
    auditLogs,
    isAuditLoading,
    auditTotal,
    page,
    pageSize,
    totalPages,
    filterAction,
    setFilterAction,
    filterEmail,
    setFilterEmail,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    dpoConsents,
    isConsentsLoading,
    retentionItems,
    isRetentionLoading,
    errorMessage,
    selectedLogDetail,
    setSelectedLogDetail,
    loadAuditLogs,
    loadDpoConsents,
    loadRetentionSchedule,
    handleTabChange,
    handleFilterSubmit,
    handleResetFilter,
  }
}
