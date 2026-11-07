/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        erp: {
          bg: "#0f172a",       // Deep Slate for sidebar/header
          canvas: "#f8fafc",   // Light utilitarian canvas
          card: "#ffffff",     // Pure white cards
          border: "#cbd5e1",   // Sharp gray borders
          borderDark: "#94a3b8",
          text: "#0f172a",     // High contrast dark charcoal
          muted: "#475569",    // Neutral muted text
          primary: "#1e3a5f",  // Industrial navy
          primaryHover: "#0f2744",
          success: "#166534",  // Deep green for revenue / credits
          successBg: "#f0fdf4",
          danger: "#991b1b",   // Deep crimson for expenses / debits
          dangerBg: "#fef2f2",
          warning: "#854d0e",  // Deep amber for dues / alerts
          warningBg: "#fefce8",
          slate: "#334155",
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
