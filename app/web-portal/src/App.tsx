import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="min-h-screen bg-bg-app text-text-primary p-8 flex flex-col items-center justify-center">
      <div className="max-w-xl w-full bg-surface-card border border-border-subtle rounded-xl shadow-sm p-6 text-center space-y-6">
        <div className="flex justify-center items-center gap-4">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="h-12 w-12 hover:scale-105 transition-transform" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="h-12 w-12 hover:scale-105 transition-transform" alt="React logo" />
          </a>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">
            Face Attendance Portal
          </h1>
          <p className="text-sm text-text-secondary">
            Thiết kế đồng bộ Figma Tokens & Tailwind CSS 4
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center py-2">
          <span className="px-3 py-1 bg-brand-light text-brand-primary text-xs font-medium rounded-full">
            Brand Indigo
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-status-success text-xs font-medium rounded-full">
            Đúng giờ
          </span>
          <span className="px-3 py-1 bg-amber-50 text-status-warning text-xs font-medium rounded-full">
            Đi muộn
          </span>
          <span className="px-3 py-1 bg-rose-50 text-status-danger text-xs font-medium rounded-full">
            Vắng mặt
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
          >
            Số lượt kiểm tra: {count}
          </button>
        </div>
      </div>
    </main>
  )
}

export default App
