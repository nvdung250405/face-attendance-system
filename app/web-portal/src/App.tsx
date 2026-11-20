/**
 * Cổng Thông Tin Web Phân Hệ FAS (web-portal)
 * Khởi tạo Bộ định tuyến chính AppRoutes bọc bởi BrowserRouter và QueryClientProvider (BLD-WEB-003, TASK-WEB-007).
 * Tích hợp GlobalErrorBoundary chống trắng màn hình và Toaster thông báo toàn cục.
 */

import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/services/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'
import { GlobalErrorBoundary } from '@/components/fallback/GlobalErrorBoundary'
import { Toaster, toast } from '@/components/ui'

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  ;(window as unknown as { __toast?: typeof toast }).__toast = toast
}

function App() {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  )
}

export default App
