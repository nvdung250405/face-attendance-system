/**
 * Cổng Thông Tin Web Phân Hệ FAS (web-portal)
 * Khởi tạo Bộ định tuyến chính AppRoutes bọc bởi BrowserRouter và QueryClientProvider (BLD-WEB-003, TASK-WEB-007).
 */

import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/services/queryClient'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
