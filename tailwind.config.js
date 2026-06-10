/**
 * Tailwind configuration for Technited Studio.
 *
 * This mirrors the config consumed by the CDN runtime in index.html so the
 * design tokens (colors, shadows, animations) live in source control rather
 * than only inline. When migrating to a full PostCSS/Vite Tailwind build,
 * this file becomes the single source of truth.
 */
export default {
  content: ['./index.html', './**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#050505',
        charcoal: '#0a0a0a',
        laserBlue: '#00f0ff',
        laserPurple: '#7000ff',
        deepWine: '#2b0510',
        midnight: '#020208',
        glass: 'rgba(20, 20, 20, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 20px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 10px rgba(112, 0, 255, 0.5), 0 0 20px rgba(112, 0, 255, 0.3)',
        'neon-red': '0 0 10px rgba(255, 0, 50, 0.5), 0 0 20px rgba(255, 0, 50, 0.3)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.05), inset 0 20px 40px rgba(0,0,0,0.2)',
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        'scan-vertical': 'scanVertical 2s linear infinite',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        flash: 'flash 1s ease-out forwards',
        'gradient-flow': 'gradientFlow 30s ease infinite',
        'border-rotate': 'borderRotate 4s linear infinite',
        progress: 'progress 4s ease-out forwards',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        scanline: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        scanVertical: {
          '0%': { top: '-10%', opacity: '0' },
          '15%': { opacity: '1' },
          '85%': { opacity: '1' },
          '100%': { top: '110%', opacity: '0' },
        },
        flash: {
          '0%': { opacity: '0' },
          '10%': { opacity: '0.2' },
          '100%': { opacity: '0' },
        },
        gradientFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        borderRotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        progress: {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '95%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
