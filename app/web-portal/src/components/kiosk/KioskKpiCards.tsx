import React from 'react'
import { Server, Wifi, AlertTriangle, WifiOff } from 'lucide-react'

export interface KioskKpiCardsProps {
  totalCount: number
  onlineCount: number
  warningCount: number
  offlineCount: number
}

export const KioskKpiCards: React.FC<KioskKpiCardsProps> = ({
  totalCount,
  onlineCount,
  warningCount,
  offlineCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Tổng số trạm */}
      <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl ring-1 ring-indigo-500/20 bg-indigo-50/70 text-indigo-600 flex items-center justify-center shadow-xs">
            <Server size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tất cả</span>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500">Tổng số trạm</div>
          <div className="text-2xl font-extrabold font-mono text-slate-800 tracking-tight" data-testid="kpi-total-kiosks">
            {totalCount}
          </div>
        </div>
      </div>

      {/* Trực tuyến */}
      <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl ring-1 ring-emerald-500/20 bg-emerald-50/70 text-emerald-600 flex items-center justify-center shadow-xs">
            <Wifi size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            Hoạt động
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-emerald-700">Trực tuyến</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-700 tracking-tight" data-testid="kpi-online-kiosks">
            {onlineCount}
          </div>
        </div>
      </div>

      {/* Mất Ping > 5p */}
      <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl ring-1 ring-amber-500/20 bg-amber-50/70 text-amber-600 flex items-center justify-center shadow-xs">
            <AlertTriangle size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
            Mất tín hiệu
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-amber-700">Mất Ping &gt; 5p</div>
          <div className="text-2xl font-extrabold font-mono text-amber-700 tracking-tight" data-testid="kpi-stale-kiosks">
            {warningCount}
          </div>
        </div>
      </div>

      {/* Ngoại tuyến */}
      <div className="card-surface p-4.5 space-y-3 relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-slate-300 group">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl ring-1 ring-rose-500/20 bg-rose-50/70 text-rose-600 flex items-center justify-center shadow-xs">
            <WifiOff size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
            Gián đoạn
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-rose-700">Ngoại tuyến</div>
          <div className="text-2xl font-extrabold font-mono text-rose-700 tracking-tight" data-testid="kpi-offline-kiosks">
            {offlineCount}
          </div>
        </div>
      </div>
    </div>
  )
}
