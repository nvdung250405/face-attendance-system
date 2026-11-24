/**
 * Cấu hình Tailwind Design Tokens & Theme (BLD-WEB-004, TASK-WEB-008, UXD-WEB-001).
 * Đồng bộ chuẩn thiết kế Figma (Indigo Clean SaaS, Bảng màu doanh nghiệp FAS).
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkNavy: "#102D53",
          navyCard: "#1E3A5F",
          lightBlue: "#80B4FF",
          primary: "#4F46E5",
          hover: "#4338CA",
          light: "#EEF2FF",
        },
        bg: {
          app: "#F3F6FA",
        },
        surface: {
          card: "#FFFFFF",
        },
        border: {
          subtle: "#E2E8F0",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#64748B",
        },
        status: {
          success: "#10B981",
          "success-bg": "#ECFDF5",
          warning: "#F59E0B",
          "warning-bg": "#FFFBEB",
          danger: "#EF4444",
          "danger-bg": "#FEF2F2",
          info: "#3B82F6",
          "info-bg": "#EFF6FF",
        },
      },
      fontSize: {
        // Bổ sung text-2xs vì Tailwind không có sẵn (11px/14px)
        // Dùng để hiển thị helper text, caption, nhãn nhỏ dưới form
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }], // 11px / 14px
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px / 16px (Tailwind default)
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px / 20px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px / 24px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px / 28px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px / 28px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px / 32px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px / 36px
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Open Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      spacing: {
        sidebar: "260px",
        "sidebar-collapsed": "72px",
        "top-header": "64px",
        drawer: "420px",
      },
      maxWidth: {
        "auth-form": "440px",
        "brand-space": "650px",
        "auth-space": "790px",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
      zIndex: {
        header: "30",
        sidebar: "40",
        overlay: "45",
        modal: "50",
        toast: "60",
        tooltip: "70",
      },
      animation: {
        "green-flash": "greenFlash 1.5s ease-out forwards",
        "pulse-dot": "pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        greenFlash: {
          "0%": { backgroundColor: "#ECFDF5" },
          "100%": { backgroundColor: "transparent" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};
