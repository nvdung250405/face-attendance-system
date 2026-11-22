/**
 * Thanh Điều hướng Bên trái Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * - Chiều rộng 260px (mở rộng) / 72px (thu gọn).
 * - Danh mục menu phân theo vai trò người dùng.
 * - Đáy sidebar: nút thu gọn/mở rộng và nút đăng xuất.
 * - Chuyển động CSS 200ms ease-in-out.
 */

import React, { useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Users,
  Calendar,
  Lock,
  FileBarChart,
  Monitor,
  ShieldCheck,
  CalendarCheck,
  ScanFace,
  MessageSquareText,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { LogoutConfirmModal } from "@/components/account";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { UserRole } from "@/types/auth";

// ── Định nghĩa mục điều hướng ─────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Nhóm Quản trị
  {
    label: "Bảng điều khiển Live",
    to: "/admin/dashboard",
    icon: <LayoutDashboard size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN", "DPO"],
  },
  {
    label: "Lịch sử điểm danh",
    to: "/admin/attendance",
    icon: <History size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN", "DPO"],
  },
  {
    label: "Hồ sơ nhân sự",
    to: "/admin/employees",
    icon: <Users size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    label: "Ca & Phân ca",
    to: "/admin/shifts",
    icon: <Calendar size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    label: "Chốt kỳ công",
    to: "/admin/payroll-periods",
    icon: <Lock size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    label: "Duyệt giải trình",
    to: "/admin/excuse-requests",
    icon: <FileQuestion size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    label: "Báo cáo tổng hợp",
    to: "/admin/reports",
    icon: <FileBarChart size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN", "DPO"],
  },
  {
    label: "Quản lý Kiosk",
    to: "/admin/kiosks",
    icon: <Monitor size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN"],
  },
  {
    label: "Nhật ký kiểm toán",
    to: "/admin/audit-logs",
    icon: <ShieldCheck size={20} strokeWidth={1.75} />,
    roles: ["HR_MANAGER", "ADMIN", "DPO"],
  },
  // Nhóm Nhân viên
  {
    label: "Bảng công của tôi",
    to: "/employee/dashboard",
    icon: <CalendarCheck size={20} strokeWidth={1.75} />,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Đơn giải trình",
    to: "/employee/excuse-requests",
    icon: <FileQuestion size={20} strokeWidth={1.75} />,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Đăng ký sinh trắc & OTP",
    to: "/employee/consent",
    icon: <ScanFace size={20} strokeWidth={1.75} />,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Yêu cầu dữ liệu cá nhân",
    to: "/employee/data-requests",
    icon: <MessageSquareText size={20} strokeWidth={1.75} />,
    roles: ["EMPLOYEE"],
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const userRole = useAuthStore((s) => s.user?.role);
  const location = useLocation();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const visibleItems = useMemo(() => {
    return NAV_ITEMS.filter(
      (item) => userRole && (userRole === "ADMIN" || item.roles.includes(userRole)),
    );
  }, [userRole]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      style={{
        width: collapsed
          ? "var(--spacing-sidebar-collapsed)"
          : "var(--spacing-sidebar)",
        transition: "width 200ms ease-in-out, transform 200ms ease-in-out",
      }}
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col bg-gradient-to-b from-[#0b1727] to-[#091322] border-r border-white/8 overflow-hidden shrink-0 shadow-sm ${
        collapsed ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
      }`}
    >
      {/* ── Logo ── */}
      <div className="flex items-center justify-between px-4.5 h-16 border-b border-white/8 shrink-0 bg-white/2">
        <div className="flex items-center gap-3">
          <div className="w-9.5 h-9.5 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-sm shrink-0 shadow-xs ring-1 ring-white/15 tracking-wide">
            FAS
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-bold text-sm tracking-tight leading-tight whitespace-nowrap">
                FAS Portal
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">
                  Enterprise 2.0
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Nút đóng Sidebar nhanh trên Mobile (< 768px) khi đang mở */}
        {!collapsed && (
          <button
            type="button"
            id="sidebar-close-mobile"
            data-testid="sidebar-close-mobile"
            aria-label="Đóng sidebar"
            onClick={onToggleCollapse}
            className="md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* ── Nav Menu ── */}
      <TooltipProvider delayDuration={150}>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-2 px-3">
          {visibleItems.map((item) => {
            const isFirstEmployeeItem = userRole === "ADMIN" && item.to === "/employee/dashboard";
            const isActive = location.pathname === item.to;
            const linkClassName = [
              "flex items-center rounded-xl min-h-[44px] text-sm font-medium transition-all duration-150",
              collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3 py-2.5 gap-3",
              "group relative select-none",
              isActive
                ? "bg-indigo-600 text-white font-semibold shadow-xs"
                : "text-slate-300 hover:bg-white/8 hover:text-white",
            ].join(" ");

            const navLink = (
              <NavLink
                to={item.to}
                className={linkClassName}
              >
                <span className="shrink-0 transition-colors duration-150">{item.icon}</span>
                {!collapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );

            return (
              <React.Fragment key={item.to}>
                {isFirstEmployeeItem && (
                  <div className={collapsed ? "py-1.5 px-1" : "pt-3 pb-1 px-3"}>
                    {collapsed ? (
                      <div className="border-t border-white/10 my-0.5" />
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-white/10 pt-2">
                        Giao diện Nhân viên
                      </div>
                    )}
                  </div>
                )}
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  navLink
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </TooltipProvider>

      {/* ── Footer: Toggle + Logout ── */}
      <div className="shrink-0 border-t border-white/8 px-3 py-3 space-y-1 bg-black/20">
        {/* Nút thu gọn / mở rộng (chỉ hiện trên tablet & desktop md+) */}
        <button
          type="button"
          id="sidebar-toggle"
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          onClick={onToggleCollapse}
          className={`w-full hidden md:flex items-center rounded-xl min-h-[44px] text-slate-300 hover:bg-white/8 hover:text-white transition-all duration-150 cursor-pointer ${
            collapsed ? "justify-center px-0 w-11 mx-auto" : "px-3 py-2.5 gap-3"
          }`}
        >
          <span className="shrink-0">
            {collapsed ? (
              <ChevronRight size={18} strokeWidth={2} />
            ) : (
              <ChevronLeft size={18} strokeWidth={2} />
            )}
          </span>
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">
              Thu gọn
            </span>
          )}
        </button>

        {/* Nút đăng xuất */}
        <button
          type="button"
          id="sidebar-logout"
          onClick={handleLogout}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`w-full flex items-center rounded-xl min-h-[44px] text-slate-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all duration-150 cursor-pointer ${
            collapsed ? "justify-center px-0 w-11 mx-auto" : "px-3 py-2.5 gap-3"
          }`}
        >
          <span className="shrink-0">
            <LogOut size={18} strokeWidth={1.75} />
          </span>
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap">
              Đăng xuất
            </span>
          )}
        </button>
      </div>

      {/* ── Hộp thoại Xác nhận Đăng xuất Toàn cục ── */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </aside>
  );
};
