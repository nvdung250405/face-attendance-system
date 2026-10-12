/**
 * Unit Tests cho Design Tokens & Theme (BLD-WEB-004, TASK-WEB-008, UXD-WEB-001).
 */

import { describe, it, expect } from 'vitest'
import {
  COLOR_TOKENS,
  LAYOUT_TOKENS,
  BREAKPOINT_TOKENS,
  TRANSITION_TOKENS,
} from '../tokens'
import tailwindConfig from '../../../tailwind.config'

describe('Tailwind Tokens & Theme (TASK-WEB-008)', () => {
  describe('1. Bảng màu Chuẩn Doanh nghiệp (Figma & Indigo Clean SaaS)', () => {
    it('chứa đầy đủ các mã màu thương hiệu FAS khớp 100% với Figma', () => {
      expect(COLOR_TOKENS.brandDarkNavy).toBe('#102D53')
      expect(COLOR_TOKENS.brandNavyCard).toBe('#1E3A5F')
      expect(COLOR_TOKENS.brandLightBlue).toBe('#80B4FF')
      expect(COLOR_TOKENS.brandPrimary).toBe('#4F46E5')
      expect(COLOR_TOKENS.brandHover).toBe('#4338CA')
      expect(COLOR_TOKENS.brandLight).toBe('#EEF2FF')
    })

    it('chứa các màu nền canvas, thẻ và đường viền chuẩn xác', () => {
      expect(COLOR_TOKENS.bgApp).toBe('#F3F6FA')
      expect(COLOR_TOKENS.surfaceCard).toBe('#FFFFFF')
      expect(COLOR_TOKENS.borderSubtle).toBe('#E2E8F0')
    })

    it('chứa các màu văn bản chuẩn', () => {
      expect(COLOR_TOKENS.textPrimary).toBe('#0F172A')
      expect(COLOR_TOKENS.textSecondary).toBe('#64748B')
      expect(COLOR_TOKENS.textMuted).toBe('#94A3B8')
    })

    it('chứa các màu trạng thái điểm danh và cảnh báo', () => {
      expect(COLOR_TOKENS.statusSuccess).toBe('#10B981')
      expect(COLOR_TOKENS.statusSuccessBg).toBe('#ECFDF5')
      expect(COLOR_TOKENS.statusWarning).toBe('#F59E0B')
      expect(COLOR_TOKENS.statusWarningBg).toBe('#FFFBEB')
      expect(COLOR_TOKENS.statusDanger).toBe('#EF4444')
      expect(COLOR_TOKENS.statusDangerBg).toBe('#FEF2F2')
      expect(COLOR_TOKENS.statusInfo).toBe('#3B82F6')
      expect(COLOR_TOKENS.statusInfoBg).toBe('#EFF6FF')
    })
  })

  describe('2. Kích thước Bố cục Admin Shell & Khung nhìn (UXD-WEB-001)', () => {
    it('định nghĩa chính xác kích thước Sidebar, TopHeader và Drawer', () => {
      expect(LAYOUT_TOKENS.sidebarWidth).toBe('260px')
      expect(LAYOUT_TOKENS.sidebarCollapsedWidth).toBe('72px')
      expect(LAYOUT_TOKENS.topHeaderHeight).toBe('64px')
      expect(LAYOUT_TOKENS.drawerWidth).toBe('420px')
      expect(LAYOUT_TOKENS.qrCodeSize).toBe('200px')
      expect(LAYOUT_TOKENS.cardBorderRadius).toBe('12px')
      expect(LAYOUT_TOKENS.buttonBorderRadius).toBe('8px')
    })

    it('định nghĩa chính xác kích thước Split-Screen màn hình Đăng nhập (Figma 3:23918)', () => {
      expect(LAYOUT_TOKENS.authBrandSpaceWidth).toBe('650px')
      expect(LAYOUT_TOKENS.authFormSpaceWidth).toBe('790px')
      expect(LAYOUT_TOKENS.authFormMaxWidth).toBe('440px')
    })
  })

  describe('3. Breakpoints & Hiệu ứng Chuyển động (Transitions)', () => {
    it('hỗ trợ các điểm ngắt responsive theo quy chuẩn', () => {
      expect(BREAKPOINT_TOKENS.sm).toBe('640px')
      expect(BREAKPOINT_TOKENS.md).toBe('768px')
      expect(BREAKPOINT_TOKENS.lg).toBe('1024px')
      expect(BREAKPOINT_TOKENS.xl).toBe('1280px')
      expect(BREAKPOINT_TOKENS['2xl']).toBe('1440px')
    })

    it('thời lượng chuyển động đáp ứng đúng quy chuẩn trải nghiệm người dùng', () => {
      expect(TRANSITION_TOKENS.sidebarTransition).toBe('200ms ease-in-out')
      expect(TRANSITION_TOKENS.greenFlashDuration).toBe('1500ms')
    })
  })

  describe('4. Cấu hình tailwind.config.js', () => {
    it('xuất cấu hình chứa đầy đủ extend colors, fonts và animations', () => {
      const extend = tailwindConfig.theme?.extend as Record<string, Record<string, unknown>>

      expect(extend?.colors).toBeDefined()
      const brandColors = extend?.colors?.brand as Record<string, string>
      expect(brandColors?.primary).toBe('#4F46E5')
      expect(brandColors?.darkNavy).toBe('#102D53')

      const spacing = extend?.spacing as Record<string, string>
      expect(spacing?.sidebar).toBe('260px')
      expect(spacing?.['sidebar-collapsed']).toBe('72px')

      const animation = extend?.animation as Record<string, string>
      expect(animation?.['green-flash']).toContain('greenFlash 1.5s')
    })
  })
})
