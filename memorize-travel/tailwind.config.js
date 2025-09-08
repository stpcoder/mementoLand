/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0064FF',
        secondary: '#6B7684',
        success: '#00C896',
        background: '#F5F7FA',
        surface: '#FFFFFF',
        text: {
          primary: '#191F28',
          secondary: '#6B7684',
          disabled: '#C1C7CD'
        }
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'modal': '20px'
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.16)',
        'button': '0 2px 12px rgba(0, 100, 255, 0.24)'
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.5s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}