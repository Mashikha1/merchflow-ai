/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#FAF9F7',
          sidebar: '#F5F3EF',
          card: '#FFFFFF',
          'card-muted': '#FAF8F5',
          hover: '#F0EDE8',
          active: '#EDE8E0',
        },
        border: {
          subtle: '#E4DDD4',
          soft: 'rgba(41, 30, 20, 0.07)',
        },
        content: {
          primary: '#1C1410',
          secondary: '#6B5E52',
          tertiary: '#A09080',
          inverse: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#C47B2B',
          hover: '#A96820',
          soft: '#FDF3E3',
          strong: '#8A5218',
        },
        semantic: {
          success: '#2D7A4F',
          'success-bg': '#F0FAF4',
          warning: '#B45309',
          'warning-bg': '#FEF9ED',
          error: '#C0392B',
          'error-bg': '#FEF2F0',
          info: '#1D5FAD',
          'info-bg': '#EEF4FD',
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(41,30,20,0.06), 0 4px 12px rgba(41,30,20,0.08)',
        'card-hover': '0 2px 6px rgba(41,30,20,0.08), 0 8px 20px rgba(41,30,20,0.12)',
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      }
    },
  },
  plugins: [],
}
