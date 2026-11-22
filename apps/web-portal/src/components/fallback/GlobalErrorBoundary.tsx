import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Bắt được lỗi unhandled runtime:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }))
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="global-error-boundary-screen"
          className="min-h-screen bg-bg-app flex items-center justify-center p-4 sm:p-6"
        >
          <div className="max-w-lg w-full bg-surface-card border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Icon lỗi nổi bật */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <AlertOctagon size={34} strokeWidth={2.25} />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2">
                Lỗi hệ thống 500
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Đã xảy ra sự cố ngoài ý muốn
              </h1>
            </div>

            {/* Chi tiết lỗi (kỹ thuật) có thể gập mở */}
            {this.state.error && (
              <div className="text-left border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between transition-colors cursor-pointer bg-slate-100/60"
                >
                  <span>Chi tiết lỗi kỹ thuật: {this.state.error.name}</span>
                  {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {this.state.showDetails && (
                  <div className="p-3.5 text-2xs font-mono text-rose-700 bg-rose-50/50 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed border-t border-slate-200">
                    <p className="font-bold">{this.state.error.message}</p>
                    {this.state.errorInfo?.componentStack && (
                      <p className="mt-2 text-slate-600">{this.state.errorInfo.componentStack}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Nút hành động */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw size={17} />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Home size={17} />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
