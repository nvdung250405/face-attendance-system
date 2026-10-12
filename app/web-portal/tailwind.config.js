/**
 * Cấu hình Tailwind Design Tokens & Theme (BLD-WEB-004, TASK-WEB-008, UXD-WEB-001).
 * Đồng bộ chuẩn thiết kế Figma (Indigo Clean SaaS, Bảng màu doanh nghiệp FAS).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          darkNavy: '#102D53',
          navyCard: '#1E3A5F',
          lightBlue: '#80B4FF',
          primary: '#4F46E5',
          hover: '#4338CA',
          light: '#EEF2FF',
        },
        bg: {
          app: '#F3F6FA',
        },
        surface: {
          card: '#FFFFFF',
        },
        border: {
          subtle: '#E2E8F0',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        status: {
          success: '#10B981',
          'success-bg': '#ECFDF5',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#EF4444',
          'danger-bg': '#FEF2F2',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Open Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      spacing: {
        sidebar: '260px',
        'sidebar-collapsed': '72px',
        'top-header': '64px',
        drawer: '420px',
      },
      maxWidth: {
        'auth-form': '440px',
        'brand-space': '650px',
        'auth-space': '790px',
      },
      borderRadius: {
        card: '12px',
        button: '8px',
      },
      animation: {
        'green-flash': 'greenFlash 1.5s ease-out forwards',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        greenFlash: {
          '0%': { backgroundColor: '#ECFDF5' },
          '100%': { backgroundColor: 'transparent' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
}
