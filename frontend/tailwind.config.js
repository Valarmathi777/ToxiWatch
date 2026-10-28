/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          900: '#070D1B',
          850: '#0B132B',
          800: '#0F172A',
          700: '#1E293B',
          600: '#334155',
          accent: '#06B6D4',
          cyan: '#38BDF8',
          danger: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          purple: '#8B5CF6'
        }
      }
    },
  },
  plugins: [],
}
