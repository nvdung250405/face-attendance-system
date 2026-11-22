import React, { useState } from 'react'
import { Button, Input, Badge, Checkbox, Switch } from '@/components/ui'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Save,
  RotateCcw,
} from 'lucide-react'

export const DesignSystemShowcaseView: React.FC = () => {
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [switchChecked, setSwitchChecked] = useState(true)
  const [selectedRole, setSelectedRole] = useState('ADMIN')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [textareaValue, setTextareaValue] = useState('Đơn xin giải trình ca làm việc ngày 15/11/2026 do thiết bị Kiosk quét vân tay gặp trục trặc kỹ thuật.')

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-10 bg-slate-900/80 rounded-3xl border border-slate-800 text-slate-100 shadow-2xl">
      {/* ── Tiêu đề Hệ Thống ── */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">FAS Global UI — Primitives & Form Anatomy</h1>
            <p className="text-xs text-slate-400 mt-1">Toàn bộ viên gạch linh kiện gốc & khuôn mẫu bố cục Form mà mọi tính năng nghiệp vụ kế thừa</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TẦNG 1: NGUYÊN TỬ & LINH KIỆN NHẬP LIỆU GỐC (PRIMITIVES)             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── 1. Nút Bấm Chuẩn Hóa ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider">1. Nút Bấm Chuẩn Hóa (Touch Target ≥ 44px)</h2>
          <span className="text-[11px] text-slate-500 font-mono">Tier 1: Button Primitives</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="default">Primary Default</Button>
          <Button variant="secondary">Secondary Outline</Button>
          <Button variant="destructive">Destructive Danger</Button>
          <Button variant="outline">Outline Ghost</Button>
          <Button variant="default" disabled>Vô hiệu hóa</Button>
          <Button variant="default" isLoading>Đang lưu...</Button>
          <Button variant="default" className="min-h-[44px] px-5 bg-indigo-600 hover:bg-indigo-700">Touch Target 44px</Button>
        </div>
      </section>

      {/* ── 2. Cấu Trúc Trường Biểu Mẫu (Form Field Anatomy & Validation States) ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider">2. Cấu Trúc Trường Biểu Mẫu (Form Anatomy & Validation)</h2>
          <span className="text-[11px] text-slate-500 font-mono">Tier 1: Input Primitives</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trường Tiêu Chuẩn */}
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>Họ và tên <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-500 font-normal">Mặc định</span>
            </label>
            <Input
              placeholder="Nhập họ và tên..."
              defaultValue="Nguyễn Văn Dũng"
              className="min-h-[44px] bg-slate-900 border-slate-700 text-slate-100"
            />
            <p className="text-[11px] text-slate-400">Tên đầy đủ theo CMND / CCCD gắn chip</p>
          </div>

          {/* Trường Báo Lỗi Validation */}
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-rose-500/30">
            <label className="text-xs font-semibold text-rose-300 flex items-center justify-between">
              <span>Email công vụ <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-rose-400 font-normal">Trạng thái lỗi</span>
            </label>
            <div className="relative">
              <Input
                placeholder="email@company.vn"
                defaultValue="sai_dinh_dang_email"
                error="Email không hợp lệ (cần đuôi @company.vn)"
                className="min-h-[44px] bg-slate-900 border-rose-500 text-slate-100 pr-10"
              />
              <AlertCircle size={18} className="absolute right-3 top-3 text-rose-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
              <span>• Vui lòng nhập đúng định dạng email doanh nghiệp</span>
            </p>
          </div>

          {/* Trường Xác Thực Thành Công */}
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-emerald-500/30">
            <label className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
              <span>Mã nhân viên</span>
              <span className="text-[10px] text-emerald-400 font-normal">Hợp lệ</span>
            </label>
            <div className="relative">
              <Input
                defaultValue="NV-2026-8899"
                readOnly
                className="min-h-[44px] bg-slate-900 border-emerald-500 text-slate-100 pr-10 font-mono"
              />
              <CheckCircle2 size={18} className="absolute right-3 top-3 text-emerald-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">Hồ sơ đã được xác minh trên hệ thống</p>
          </div>
        </div>

        {/* Mật khẩu & Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Ô Nhập Mật Khẩu với Eye Toggle 40px */}
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200">
              Mật khẩu xác thực <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                defaultValue="MatKhauBaoMat@2026"
                className="min-h-[44px] bg-slate-900 border-slate-700 text-slate-100 pr-12 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Eye toggle kích thước 40px dễ chạm trên màn hình điện thoại</p>
          </div>

          {/* Trường Dropdown Select */}
          <div className="space-y-1.5 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-200">
              Phân quyền tài khoản (Select Control) <span className="text-rose-500">*</span>
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="min-h-[44px] bg-slate-900 border-slate-700 text-slate-200">
                <SelectValue placeholder="Chọn vai trò..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                <SelectItem value="HR_MANAGER">Quản lý Nhân sự (HR)</SelectItem>
                <SelectItem value="DPO">Cán bộ DPO</SelectItem>
                <SelectItem value="EMPLOYEE">Nhân viên (Employee)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-slate-400">Dropdown chuẩn accessibility WCAG AAA</p>
          </div>
        </div>
      </section>

      {/* ── 3. Checkbox, Switch & Tooltip ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider">3. Điều Khiển Lựa Chọn & Trạng Thái (Controls)</h2>
          <span className="text-[11px] text-slate-500 font-mono">Tier 1: Toggle Primitives</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <Checkbox
              id="showcase-checkbox"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
            />
            <label htmlFor="showcase-checkbox" className="text-xs sm:text-sm text-slate-200 font-medium cursor-pointer">
              Đồng ý điều khoản NĐ 13/2023
            </label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="showcase-switch"
              checked={switchChecked}
              onChange={(e) => setSwitchChecked(e.target.checked)}
            />
            <label htmlFor="showcase-switch" className="text-xs sm:text-sm text-slate-200 font-medium cursor-pointer">
              Bật xác thực 2 lớp (Mã PIN)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 transition-colors cursor-pointer">
                    Rê chuột xem Tooltip ℹ️
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Tooltip định vị tự động theo không gian hiển thị</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </section>

      {/* ── 4. Badges Trạng Thái ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider">4. Thẻ Trạng Thái Ngữ Nghĩa (Status Badges)</h2>
          <span className="text-[11px] text-slate-500 font-mono">Tier 1: Semantic Badges</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Badge variant="success">✓ Hoạt động (Active)</Badge>
          <Badge variant="warning">⏳ Chờ duyệt (Pending)</Badge>
          <Badge variant="destructive">✕ Khóa tạm thời (Blocked)</Badge>
          <Badge variant="outline">⚡ Ngoại tuyến (Offline)</Badge>
          <Badge variant="info">ℹ️ Thông tin bổ sung</Badge>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TẦNG 2: KHUÔN MẪU BỐ CỤC & FORM KẾ THỪA (PATTERNS)                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* ── 5. Mẫu Form Kế Thừa & Sticky Actions Bar ── */}
      <section className="space-y-4 bg-slate-950/70 p-5 sm:p-6 rounded-3xl border border-indigo-500/20">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              5. Khuôn Mẫu Form Kế Thừa (Form Pattern with Sticky Actions Bar)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Mẫu form 2 cột trên Desktop tự co thành 1 cột trên Mobile kèm thanh Sticky Actions</p>
          </div>
          <span className="text-[11px] text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/30">Tier 2 Pattern</span>
        </div>

        {/* Textarea nhập nội dung dài */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>Nội dung mô tả chi tiết <span className="text-rose-500">*</span></span>
            <span className="text-[11px] text-slate-400">{textareaValue.length} / 250 ký tự</span>
          </label>
          <textarea
            rows={3}
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Thanh Hành Động Form (Sticky Bar trên Mobile, Căn phải trên Desktop) */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Mọi thay đổi chưa lưu sẽ tự động hoàn tác khi hủy</span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 sm:flex-none min-h-[44px] text-xs font-semibold"
            >
              <RotateCcw size={14} />
              <span>Hủy Bỏ</span>
            </Button>
            <Button
              type="button"
              variant="default"
              isLoading={isSubmitting}
              onClick={() => {
                setIsSubmitting(true)
                setTimeout(() => setIsSubmitting(false), 1200)
              }}
              className="flex-1 sm:flex-none min-h-[44px] text-xs font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              <Save size={14} />
              <span>Lưu Thay Đổi</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 6. Khuôn Mẫu Trạng Thái Rỗng & Skeleton Loading ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-wider">6. Khuôn Mẫu Trạng Thái Rỗng & Tải Dữ Liệu (State Patterns)</h2>
          <span className="text-[11px] text-slate-500 font-mono">Tier 2: Empty & Skeleton</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empty State */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 border-dashed text-center space-y-3 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Inbox size={24} />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Chưa có bản ghi nào</div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">Không tìm thấy dữ liệu điểm danh phù hợp với điều kiện bộ lọc hiện tại</p>
            </div>
            <Button variant="outline" size="sm" className="min-h-[38px] text-xs">
              Làm Mới Bộ Lọc
            </Button>
          </div>

          {/* Skeleton Shimmer */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skeleton Loading Shimmer</div>
            <div className="space-y-2.5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded-md w-3/4"></div>
              <div className="h-10 bg-slate-800/60 rounded-xl w-full"></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-8 bg-slate-800/50 rounded-lg"></div>
                <div className="h-8 bg-slate-800/50 rounded-lg"></div>
                <div className="h-8 bg-slate-800/50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
