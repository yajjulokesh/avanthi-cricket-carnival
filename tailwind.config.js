/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whoop: {
          carbon: '#09090b',      // Deepest matte base
          surface: '#121215',     // Primary container
          elevated: '#18181c',    // Elevated card/panel
          border: '#27272a',      // Subtle 1px structural wire
          borderMuted: '#1f1f23', // Ultra-faint internal divider
          recovery: '#22c55e',    // Performance green
          strain: '#ef4444',      // Critical / blocked red
          telemetry: '#f59e0b',   // Signal / caution amber
          highlight: '#38bdf8',   // Electric blue telemetry
          textMuted: '#71717a',   // Low-emphasis telemetry label
          textDim: '#a1a1aa',     // Secondary label
        },
      }
    },
  },
  plugins: [],
}
