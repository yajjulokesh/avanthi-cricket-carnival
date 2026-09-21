/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spengle: {
          carbon: '#060607',       // Raw matte carbon base
          chassis: '#0c0c0e',      // Monocoque frame container
          surface: '#131316',      // Structural panel
          elevated: '#1a1a1f',     // Elevated module / card
          border: '#24242b',       // Machined graphite edge
          wire: 'rgba(255, 255, 255, 0.08)', // Precision hairline
          gold: '#d4af37',         // Spengle 24k gold leaf edition
          goldHover: '#c59f2d',    // Darker gold for click state
          goldLight: '#f5d77f',    // Highlight gold shimmer
          goldMuted: 'rgba(212, 175, 55, 0.12)', // Subtle gold badge fill
          crimson: '#e11d48',      // High-velocity chrono / warning
          crimsonMuted: 'rgba(225, 29, 72, 0.12)',
          emerald: '#10b981',      // Kinetic go / optimal quota
          titanium: '#f4f4f5',     // Razor-sharp primary typography
          muted: '#8e8e93',        // Swiss micro-label text
          dim: '#52525b',          // Structural index labels
        },
        whoop: {
          carbon: '#060607',      // Deepest matte base
          surface: '#0c0c0e',     // Monocoque container
          elevated: '#131316',    // Elevated card/panel
          border: '#24242b',      // Subtle machined structural wire
          borderMuted: '#1a1a1f', // Hairline internal divider
          recovery: '#10b981',    // Performance green
          strain: '#e11d48',      // Critical / blocked crimson
          telemetry: '#d4af37',   // Spengle 24k gold telemetry
          highlight: '#d4af37',   // Precision gold highlight
          textMuted: '#8e8e93',   // Swiss micro-label text
          textDim: '#52525b',     // Secondary dim index
        },
      },
      letterSpacing: {
        'widest-tech': '0.25em',
        'super-tech': '0.35em',
      }
    },
  },
  plugins: [],
}
