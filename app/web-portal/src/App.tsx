/**
 * Cổng Thông Tin Web Phân Hệ FAS (web-portal)
 * Khởi tạo Bộ định tuyến chính AppRoutes bọc bởi BrowserRouter.
 */

import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
