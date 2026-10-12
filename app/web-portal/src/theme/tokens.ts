/**
 * FAS Web Portal Design Tokens
 * (UXD-WEB-001, BLD-WEB-004, TASK-WEB-008, DD-WEB-012).
 *
 * Khai báo tập trung toàn bộ Tokens chuẩn hóa từ Figma (Indigo Clean SaaS):
 * - Bảng màu thương hiệu và bảng màu ngữ nghĩa trạng thái.
 * - Kích thước bố cục (Sidebar, Header, Drawer, Modal).
 * - Typography và bán kính bo góc.
 */

export const COLOR_TOKENS = {
  // Thương hiệu FAS
  brandDarkNavy: '#102D53',
  brandNavyCard: '#1E3A5F',
  brandLightBlue: '#80B4FF',
  brandPrimary: '#4F46E5',
  brandHover: '#4338CA',
  brandLight: '#EEF2FF',

  // Canvas & Bề mặt
  bgApp: '#F3F6FA',
  surfaceCard: '#FFFFFF',
  borderSubtle: '#E2E8F0',

  // Văn bản
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Trạng thái Điểm danh & Hệ thống
  statusSuccess: '#10B981',
  statusSuccessBg: '#ECFDF5',
  statusWarning: '#F59E0B',
  statusWarningBg: '#FFFBEB',
  statusDanger: '#EF4444',
  statusDangerBg: '#FEF2F2',
  statusInfo: '#3B82F6',
  statusInfoBg: '#EFF6FF',
} as const

export const LAYOUT_TOKENS = {
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '72px',
  topHeaderHeight: '64px',
  drawerWidth: '420px',
  authBrandSpaceWidth: '650px',
  authFormSpaceWidth: '790px',
  authFormMaxWidth: '440px',
  qrCodeSize: '200px',
  cardBorderRadius: '12px',
  buttonBorderRadius: '8px',
} as const

export const BREAKPOINT_TOKENS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const

export const TRANSITION_TOKENS = {
  sidebarTransition: '200ms ease-in-out',
  drawerTransition: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  greenFlashDuration: '1500ms',
} as const

export type ColorTokenKey = keyof typeof COLOR_TOKENS
export type LayoutTokenKey = keyof typeof LAYOUT_TOKENS
