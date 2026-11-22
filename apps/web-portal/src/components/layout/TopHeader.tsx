/**
 * Thanh Tiêu đề Trên cùng Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * - Chiều cao 64px, sticky top-0 z-30.
 * - Trái: Breadcrumb đường dẫn.
 * - Giữa: Chỉ báo trạng thái kết nối STOMP.
 * - Phải: Chuông thông báo + Avatar + Dropdown menu tài khoản.
 */

import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useStompConnectionStore } from "@/store/stompConnectionStore";
import {
  ChangePasswordModal,
  PinManagementModal,
  LogoutConfirmModal,
} from "@/components/account";

import { useNotificationStore } from "@/store/notificationStore";
import { notificationService } from "@/services/notificationService";
import { NotificationDrawer } from "@/components/notification";

// ── Breadcrumb map ────────────────────────────────────────────────────────────

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin/dashboard": "Bảng điều khiển Live",
  "/admin/attendance": "Lịch sử điểm danh",
  "/admin/employees": "Hồ sơ nhân sự",
  "/admin/shifts": "Ca & Phân ca",
  "/admin/payroll-periods": "Chốt kỳ công",
  "/admin/reports": "Báo cáo tổng hợp",
  "/admin/excuse-requests": "Duyệt đơn giải trình",
  "/admin/kiosks": "Quản lý Kiosk",
  "/admin/audit-logs": "Nhật ký kiểm toán",
  "/employee/dashboard": "Bảng công của tôi",
  "/employee/excuse-requests": "Đơn giải trình của tôi",
  "/employee/consent": "Đăng ký sinh trắc & OTP",
  "/employee/data-requests": "Yêu cầu dữ liệu cá nhân",
};

import { Bell, ChevronDown, Lock, Shield, LogOut, Menu } from "lucide-react";

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconBell = ({
  hasUnread,
  unreadCount,
}: {
  hasUnread: boolean;
  unreadCount?: number;
}) => (
  <div className="relative">
    <Bell size={20} strokeWidth={1.75} />
    {hasUnread && (
      <span
        data-testid="notification-unread-badge"
        className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border border-white"
      >
        {unreadCount && unreadCount > 99 ? "99+" : unreadCount || ""}
      </span>
    )}
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  ADMIN: "Quản trị viên",
  HR_MANAGER: "Quản lý Nhân sự",
  DPO: "Cán bộ DPO",
  EMPLOYEE: "Nhân viên",
};

export interface TopHeaderProps {
  sidebarWidth?: number;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  collapsed = false,
  onToggleSidebar,
}) => {
  const user = useAuthStore((s) => s.user);
  const rawStompStatus = useStompConnectionStore((s) => s?.status);
  const stompStatus =
    typeof rawStompStatus === 'object' && rawStompStatus !== null && 'status' in rawStompStatus
      ? (rawStompStatus as { status: string }).status
      : rawStompStatus;
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isNotificationOpen = useNotificationStore((s) => s.isOpen);
  const setIsNotificationOpen = useNotificationStore((s) => s.setIsOpen);
  const initUser = useNotificationStore((s) => s.initUser);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage =
    BREADCRUMB_MAP[location.pathname] ??
    (location.pathname.startsWith("/admin")
      ? "Quản trị hệ thống"
      : location.pathname.startsWith("/employee")
        ? "Cổng nhân viên"
        : "Trang làm việc");

  // Đồng bộ thông báo của người dùng đăng nhập
  useEffect(() => {
    if (user?.id) {
      initUser(user.id);
      notificationService
        .getNotifications()
        .then((items) => {
          const mapped = items.map((res) => ({
            id: res.id,
            userId: res.userId,
            eventType: res.eventType,
            title: res.title,
            message:
              res.body ||
              (res as unknown as { message?: string }).message ||
              "",
            isRead: Boolean(res.readAt),
            createdAt: res.createdAt,
          }));
          setNotifications(mapped);
        })
        .catch(() => {
          // Bỏ qua lỗi nạp thông báo nếu không có kết nối
        });
    }
  }, [user?.id, initUser, setNotifications]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  // Đóng dropdown khi click ra ngoài hoặc bấm phím Escape (chỉ kích hoạt listener khi dropdown đang mở)
  useEffect(() => {
    if (!dropdownOpen) return;
    const clickHandler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [dropdownOpen]);

  const stompLabel =
    stompStatus === "CONNECTED"
      ? "Trực tuyến"
      : stompStatus === "CONNECTING"
        ? "Đang kết nối..."
        : "Mất kết nối";

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <>
      <header
        data-testid="top-header"
        className={`fixed top-0 right-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 flex items-center px-4 md:px-6 gap-2.5 sm:gap-4 transition-all duration-200 ease-in-out ${
          collapsed ? "md:left-[72px]" : "md:left-[260px]"
        } left-0`}
      >
        {/* ── Nút Hamburger mở menu trên Mobile (< 768px) ── */}
        <button
          type="button"
          id="header-mobile-menu"
          data-testid="header-mobile-menu"
          aria-label="Mở menu điều hướng"
          onClick={onToggleSidebar}
          className="md:hidden p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
        >
          <Menu size={20} />
        </button>

        {/* ── Breadcrumb ── */}
        <div className="flex-1 min-w-0">
          <nav aria-label="breadcrumb">
            <ol className="flex items-center gap-2 text-xs font-medium">
              <li className="hidden sm:inline text-slate-500 hover:text-slate-700 transition-colors shrink-0">
                FAS Portal
              </li>
              <li className="hidden sm:inline text-slate-300 shrink-0">/</li>
              <li className="text-slate-900 font-bold truncate text-sm">
                {currentPage}
              </li>
            </ol>
          </nav>
        </div>

        {/* ── STOMP Mobile Dot Indicator (< 768px) ── */}
        <div
          data-testid="stomp-status-mobile"
          role="status"
          aria-label={`STOMP: ${stompLabel}`}
          title={`STOMP: ${stompLabel}`}
          className="md:hidden flex items-center justify-center p-1.5 shrink-0"
        >
          <span
            className={`inline-flex rounded-full h-2.5 w-2.5 ${
              stompStatus === "CONNECTED"
                ? "bg-emerald-500"
                : stompStatus === "CONNECTING"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
            }`}
          />
        </div>

        {/* ── STOMP Indicator ── */}
        <div
          data-testid="stomp-status"
          role="status"
          aria-live="polite"
          title={
            stompStatus === "CONNECTED"
              ? "Kết nối trực tiếp thời gian thực ổn định"
              : stompStatus === "CONNECTING"
                ? "Đang kết nối lại thời gian thực..."
                : "Mất kết nối thời gian thực"
          }
          className={`hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
            stompStatus === "CONNECTED"
              ? "bg-emerald-50/90 text-emerald-700 border-emerald-200/80 shadow-xs"
              : stompStatus === "CONNECTING"
                ? "bg-amber-50/90 text-amber-700 border-amber-200/80 shadow-xs"
                : "bg-rose-50/90 text-rose-700 border-rose-200/80 shadow-xs"
          }`}
        >
          <span
            className={`inline-flex rounded-full h-2 w-2 ${
              stompStatus === "CONNECTED"
                ? "bg-emerald-500"
                : stompStatus === "CONNECTING"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-rose-500"
            }`}
          />
          <span>{stompLabel}</span>
        </div>

        {/* ── Notification Bell ── */}
        <button
          type="button"
          id="header-notifications"
          data-testid="header-notifications"
          aria-label="Thông báo"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200/60 transition-all duration-150 relative cursor-pointer"
        >
          <IconBell hasUnread={unreadCount > 0} unreadCount={unreadCount} />
        </button>

        {/* ── Avatar + Dropdown ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            id="header-avatar"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-100/90 border border-transparent hover:border-slate-200/60 transition-all duration-150 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-bold text-slate-800 leading-tight max-w-44 truncate">
                {user?.fullName ?? "Người dùng"}
              </div>
              <div className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider leading-tight mt-0.5">
                {ROLE_DISPLAY_NAMES[user?.role || ""] || user?.role}
              </div>
            </div>
            <span className="text-slate-400">
              <ChevronDown size={14} strokeWidth={2} />
            </span>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <div className="text-sm font-bold text-slate-900 truncate">
                  {user?.fullName}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email}
                </div>
              </div>
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  role="menuitem"
                  id="header-change-password"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 min-h-[44px] text-sm text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Lock size={16} className="text-slate-400 shrink-0" />
                  <span>Đổi mật khẩu</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  id="header-manage-pin"
                  data-testid="header-manage-pin"
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsPinModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2.5 min-h-[44px] text-sm text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-700 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <Shield size={16} className="text-slate-400 shrink-0" />
                  <span>
                    {user?.hasPin ? "Đổi mã PIN dự phòng" : "Thiết lập mã PIN"}
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  id="header-logout"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 min-h-[44px] text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <LogOut size={16} className="shrink-0" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Modal Đổi Mật khẩu Tự nguyện (UXD-WEB-008, DD-WEB-018) ── */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* ── Modal Thiết lập / Đặt lại Mã PIN Dự phòng (UI-WEB-008, TASK-WEB-029) ── */}
      <PinManagementModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* ── Trung tâm Thông báo Drawer (SOL-WEB-011, TASK-WEB-026) ── */}
      <NotificationDrawer />

      {/* ── Modal Xác Nhận Đăng Xuất An Toàn ── */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};
