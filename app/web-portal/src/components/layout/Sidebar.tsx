/**
 * Thanh Điều hướng Bên trái Admin Shell (UXD-WEB-001, BLD-WEB-005, TASK-WEB-009).
 *
 * - Chiều rộng 260px (mở rộng) / 72px (thu gọn).
 * - Danh mục menu phân theo vai trò người dùng.
 * - Đáy sidebar: nút thu gọn/mở rộng và nút đăng xuất.
 * - Chuyển động CSS 200ms ease-in-out.
 */

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { logoutService } from "@/services/logoutService";
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
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  const handleLogout = async () => {
    await logoutService.logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      style={{
        width: collapsed
          ? "var(--spacing-sidebar-collapsed)"
          : "var(--spacing-sidebar)",
        transition: "width 200ms ease-in-out",
      }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col bg-[#0b1b32] border-r border-white/5 overflow-hidden shrink-0 shadow-xl"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center font-extrabold text-white text-sm shrink-0 shadow-md shadow-indigo-500/25 ring-1 ring-white/20">
          FAS
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-white font-bold text-sm tracking-tight leading-tight whitespace-nowrap">
              FAS Portal
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[10px] font-semibold tracking-wider uppercase">
                Enterprise 2.0
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Nav Menu ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                "group relative select-none",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/50 font-semibold"
                  : "text-slate-300 hover:bg-white/8 hover:text-white",
              ].join(" ")
            }
          >
            <span className="shrink-0 transition-transform duration-150 group-hover:scale-105">{item.icon}</span>
            {!collapsed && (
              <span className="truncate whitespace-nowrap">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer: Toggle + Logout ── */}
      <div className="shrink-0 border-t border-white/10 px-2.5 py-3 space-y-1 bg-black/10">
        {/* Nút thu gọn / mở rộng */}
        <button
          type="button"
          id="sidebar-toggle"
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          onClick={onToggleCollapse}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-150"
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
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition-all duration-150"
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
    </aside>
  );
};
