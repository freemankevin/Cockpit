/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"Roboto"',
          '"Helvetica Neue"',
          '"Arial"',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace'
        ],
      },
      colors: {
        // macOS Sonoma 暗模式系统颜色 - 更鲜艳饱和
        macos: {
          blue: '#0A84FF',
          green: '#32D74B',
          indigo: '#5E5CE6',
          orange: '#FF9F0A',
          pink: '#FF375F',
          purple: '#BF5AF2',
          red: '#FF453A',
          teal: '#64D2FF',
          yellow: '#FFD60A',
          // 精细的灰色层次 - 更有深度
          gray: '#98989D',
          'gray-2': '#636366',
          'gray-3': '#48484A',
          'gray-4': '#3A3A3C',
          'gray-5': '#2C2C2E',
          'gray-6': '#1C1C1E',
        },
        // macOS 暗模式背景色 - 更细腻的层次
        background: {
          primary: '#161617',      // 深邃的主背景
          secondary: '#1E1E1F',    // 卡片/面板背景 - 略微提亮
          tertiary: '#282829',     // 输入框/按钮背景
          elevated: '#323234',     // 悬浮/高亮背景
          hover: '#3C3C3E',        // hover 状态
        },
        // macOS 暗模式文字颜色 - 提高对比度
        text: {
          primary: '#F5F5F7',      // 主要文字 - 更亮
          secondary: '#A1A1A6',    // 次要文字 - 更清晰
          tertiary: '#6E6E73',     // 辅助文字
          quaternary: '#48484A',   // 最淡文字
        },
        // 暗模式边框色 - 更细腻
        border: {
          primary: 'rgba(255, 255, 255, 0.08)',    // 主边框 - 略淡
          secondary: 'rgba(255, 255, 255, 0.04)',  // 次要边框
          tertiary: 'rgba(255, 255, 255, 0.12)',   // 强调边框
          focus: 'rgba(10, 132, 255, 0.5)',
        },
        // 暗模式分隔线 - 更柔和
        divider: {
          primary: 'rgba(255, 255, 255, 0.08)',
          secondary: 'rgba(255, 255, 255, 0.04)',
        },
      },
      boxShadow: {
        // macOS Sonoma 暗模式风格阴影 - 更柔和自然
        'macos': '0 2px 6px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)',
        'macos-lg': '0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2)',
        'macos-xl': '0 16px 48px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.25)',
        'macos-window': '0 24px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        'macos-button': '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 0.5px 0 rgba(255, 255, 255, 0.06)',
        'macos-button-active': 'inset 0 1px 3px rgba(0, 0, 0, 0.35)',
        'macos-input': 'inset 0 1px 2px rgba(0, 0, 0, 0.25)',
        'macos-input-focus': '0 0 0 3px rgba(10, 132, 255, 0.2), 0 0 0 1px rgba(10, 132, 255, 0.4)',
        'macos-card': '0 1px 3px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'macos-card-hover': '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'macos-dropdown': '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'macos-modal': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        // 柔和发光效果
        'glow-blue': '0 0 16px rgba(10, 132, 255, 0.25)',
        'glow-green': '0 0 16px rgba(50, 215, 75, 0.25)',
        'glow-red': '0 0 16px rgba(255, 69, 58, 0.25)',
        'glow-purple': '0 0 16px rgba(191, 90, 242, 0.25)',
      },
      borderRadius: {
        'macos': '10px',
        'macos-sm': '6px',
        'macos-lg': '14px',
        'macos-xl': '20px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-subtle': 'bounceSubtle 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(10, 132, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(10, 132, 255, 0.4)' },
        },
      },
      transitionTimingFunction: {
        'macos': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'macos-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}