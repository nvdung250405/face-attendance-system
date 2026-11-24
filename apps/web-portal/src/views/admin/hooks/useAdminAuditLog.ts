/**
 * Custom hook quản lý trạng thái, bộ lọc và truy vấn nhật ký kiểm toán & tuân thủ DPO
 * (SOL-WEB-012, UI-WEB-012, UXD-WEB-007, APD-WEB-011, BLD-WEB-021, TASK-WEB-027, ARCH-W-01).
 */

import { useState, useEffect, useCallback } from 'react'
import { complianceAdminService } from '@/services/complianceAdminService'
import { dataSubjectService } from '@/services/dataSubjectService'
import { normalizeApiError } from '@/services/errorNormalizer'
import type {
  AuditLogItem,
  DpoConsentAuditItem,
  DpoConsentWithdrawalItem,
  RetentionScheduleItem,
  DataSubjectRequestItem,
  UpdateDataSubjectRequest,
  AuditLogQueryCriteria,
} from '@/types'

export type ComplianceTab =
  | 'AUDIT_LOGS'
  | 'DPO_CONSENTS'
  | 'RETENTION_SCHEDULE'
  | 'DPO_WITHDRAWALS'
  | 'DPO_DATA_REQUESTS'

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
  const [consentsPage, setConsentsPage] = useState(0)
  const [consentsPageSize, setConsentsPageSize] = useState(20)
  const [consentsTotal, setConsentsTotal] = useState(0)
  const [consentsTotalPages, setConsentsTotalPages] = useState(1)

  // Tab 3: Retention Schedule state
  const [retentionItems, setRetentionItems] = useState<RetentionScheduleItem[]>([])
  const [isRetentionLoading, setIsRetentionLoading] = useState(false)
  const [retentionPage, setRetentionPage] = useState(0)
  const [retentionPageSize, setRetentionPageSize] = useState(20)
  const [retentionTotal, setRetentionTotal] = useState(0)
  const [retentionTotalPages, setRetentionTotalPages] = useState(1)

  // Tab 4: DPO Consent Withdrawals state
  const [dpoWithdrawals, setDpoWithdrawals] = useState<DpoConsentWithdrawalItem[]>([])
  const [isWithdrawalsLoading, setIsWithdrawalsLoading] = useState(false)
  const [withdrawalsPage, setWithdrawalsPage] = useState(0)
  const [withdrawalsPageSize, setWithdrawalsPageSize] = useState(20)
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0)
  const [withdrawalsTotalPages, setWithdrawalsTotalPages] = useState(1)

  // Tab 5: DPO Data Subject Requests state
  const [dpoDataRequests, setDpoDataRequests] = useState<DataSubjectRequestItem[]>([])
  const [isDataRequestsLoading, setIsDataRequestsLoading] = useState(false)
  const [dataRequestsPage, setDataRequestsPage] = useState(0)
  const [dataRequestsPageSize, setDataRequestsPageSize] = useState(20)
  const [dataRequestsTotal, setDataRequestsTotal] = useState(0)
  const [dataRequestsTotalPages, setDataRequestsTotalPages] = useState(1)

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
        const error = normalizeApiError(err)
        setErrorMessage(error.message || 'Không thể tải nhật ký kiểm toán.')
      } finally {
        setIsAuditLoading(false)
      }
    },
    [filterAction, filterEmail, filterStartDate, filterEndDate]
  )

  // 2. Tải DPO Consents
  const loadDpoConsents = useCallback(async (targetPage = 0, targetPageSize = 20) => {
    try {
      setIsConsentsLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoConsents({ page: targetPage, size: targetPageSize })
      const items = Array.isArray(data) ? data : ((data as { content?: DpoConsentAuditItem[]; items?: DpoConsentAuditItem[] }).content || (data as { items?: DpoConsentAuditItem[] }).items || [])
      const total = (data as { totalElements?: number })?.totalElements ?? (Array.isArray(data) ? data.length : items.length)
      const totalP = (data as { totalPages?: number })?.totalPages ?? Math.max(1, Math.ceil(total / targetPageSize))
      setDpoConsents(items)
      setConsentsTotal(total)
      setConsentsTotalPages(totalP)
      setConsentsPage(targetPage)
      setConsentsPageSize(targetPageSize)
    } catch (err) {
      const error = normalizeApiError(err)
      setErrorMessage(error.message || 'Không thể tải danh sách cam kết DPO.')
    } finally {
      setIsConsentsLoading(false)
    }
  }, [])

  // 3. Tải Retention Schedule
  const loadRetentionSchedule = useCallback(async (targetPage = 0, targetPageSize = 20) => {
    try {
      setIsRetentionLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoRetentionSchedule({ page: targetPage, size: targetPageSize })
      const items = Array.isArray(data) ? data : ((data as { content?: RetentionScheduleItem[]; items?: RetentionScheduleItem[] }).content || (data as { items?: RetentionScheduleItem[] }).items || [])
      const total = (data as { totalElements?: number })?.totalElements ?? (Array.isArray(data) ? data.length : items.length)
      const totalP = (data as { totalPages?: number })?.totalPages ?? Math.max(1, Math.ceil(total / targetPageSize))
      setRetentionItems(items)
      setRetentionTotal(total)
      setRetentionTotalPages(totalP)
      setRetentionPage(targetPage)
      setRetentionPageSize(targetPageSize)
    } catch (err) {
      const error = normalizeApiError(err)
      setErrorMessage(error.message || 'Không thể tải lịch trình tiêu hủy dữ liệu.')
    } finally {
      setIsRetentionLoading(false)
    }
  }, [])

  // 4. Tải DPO Consent Withdrawals
  const loadDpoConsentWithdrawals = useCallback(async (targetPage = 0, targetPageSize = 20) => {
    try {
      setIsWithdrawalsLoading(true)
      setErrorMessage(null)
      const data = await complianceAdminService.getDpoConsentWithdrawals({ page: targetPage, size: targetPageSize })
      const items = Array.isArray(data) ? data : ((data as { content?: DpoConsentWithdrawalItem[]; items?: DpoConsentWithdrawalItem[] }).content || (data as { items?: DpoConsentWithdrawalItem[] }).items || [])
      const total = (data as { totalElements?: number })?.totalElements ?? (Array.isArray(data) ? data.length : items.length)
      const totalP = (data as { totalPages?: number })?.totalPages ?? Math.max(1, Math.ceil(total / targetPageSize))
      setDpoWithdrawals(items)
      setWithdrawalsTotal(total)
      setWithdrawalsTotalPages(totalP)
      setWithdrawalsPage(targetPage)
      setWithdrawalsPageSize(targetPageSize)
    } catch (err) {
      const error = normalizeApiError(err)
      setErrorMessage(error.message || 'Không thể tải danh sách rút cam kết DPO.')
    } finally {
      setIsWithdrawalsLoading(false)
    }
  }, [])

  // 5. Tải DPO Data Subject Requests
  const loadDpoDataRequests = useCallback(async (targetPage = 0, targetPageSize = 20) => {
    try {
      setIsDataRequestsLoading(true)
      setErrorMessage(null)
      const data = await dataSubjectService.getDpoDataRequests({ page: targetPage, size: targetPageSize })
      const items = Array.isArray(data) ? data : ((data as { content?: DataSubjectRequestItem[]; items?: DataSubjectRequestItem[] }).content || (data as { items?: DataSubjectRequestItem[] }).items || [])
      const total = (data as { totalElements?: number })?.totalElements ?? (Array.isArray(data) ? data.length : items.length)
      const totalP = (data as { totalPages?: number })?.totalPages ?? Math.max(1, Math.ceil(total / targetPageSize))
      setDpoDataRequests(items)
      setDataRequestsTotal(total)
      setDataRequestsTotalPages(totalP)
      setDataRequestsPage(targetPage)
      setDataRequestsPageSize(targetPageSize)
    } catch (err) {
      const error = normalizeApiError(err)
      setErrorMessage(error.message || 'Không thể tải danh sách yêu cầu quyền chủ thể dữ liệu.')
    } finally {
      setIsDataRequestsLoading(false)
    }
  }, [])

  // 6. Cập nhật trạng thái yêu cầu dữ liệu
  const handleUpdateDataRequest = useCallback(
    async (id: number, data: UpdateDataSubjectRequest) => {
      try {
        setErrorMessage(null)
        await dataSubjectService.updateDataRequestStatus(id, data)
        await loadDpoDataRequests()
      } catch (err) {
        const error = normalizeApiError(err)
        setErrorMessage(error.message || 'Không thể cập nhật trạng thái yêu cầu dữ liệu.')
        throw err
      }
    },
    [loadDpoDataRequests]
  )

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
    } else if (tab === 'DPO_WITHDRAWALS' && dpoWithdrawals.length === 0) {
      loadDpoConsentWithdrawals()
    } else if (tab === 'DPO_DATA_REQUESTS' && dpoDataRequests.length === 0) {
      loadDpoDataRequests()
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
    consentsPage,
    consentsPageSize,
    consentsTotal,
    consentsTotalPages,
    retentionItems,
    isRetentionLoading,
    retentionPage,
    retentionPageSize,
    retentionTotal,
    retentionTotalPages,
    dpoWithdrawals,
    isWithdrawalsLoading,
    withdrawalsPage,
    withdrawalsPageSize,
    withdrawalsTotal,
    withdrawalsTotalPages,
    dpoDataRequests,
    isDataRequestsLoading,
    dataRequestsPage,
    dataRequestsPageSize,
    dataRequestsTotal,
    dataRequestsTotalPages,
    errorMessage,
    selectedLogDetail,
    setSelectedLogDetail,
    loadAuditLogs,
    loadDpoConsents,
    loadRetentionSchedule,
    loadDpoConsentWithdrawals,
    loadDpoDataRequests,
    handleUpdateDataRequest,
    handleTabChange,
    handleFilterSubmit,
    handleResetFilter,
  }
}
