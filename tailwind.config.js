/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        'game-bg': '#1a1a2e',
        'game-card': '#16213e',
        'game-border': '#0f3460',
        fire: '#ff6b35',
        water: '#4fc3f7',
        plant: '#81c784',
        thunder: '#ffd54f',
        dark: '#ce93d8',
        light: '#fff9c4',
      },
      animation: {
        'idle-breathe': 'idleBreathe 2s ease-in-out infinite',
        'happy-jump': 'happyJump 0.5s ease-in-out infinite',
        'sleep-zzz': 'sleepZzz 1.5s ease-in-out infinite',
        'attack-flash': 'attackFlash 0.3s ease-in-out 3',
        'evolve-glow': 'evolveGlow 0.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'sad-sway': 'sadSway 2.5s ease-in-out infinite',
        'sad-drop': 'sadDrop 2s ease-in infinite',
        'hungry-droop': 'hungryDroop 3s ease-in-out infinite',
        'hungry-callout': 'hungryCallout 1.2s ease-in-out infinite',
        'critical-blink': 'criticalBlink 0.6s ease-in-out infinite',
        'critical-warn': 'criticalWarn 0.6s ease-in-out infinite',
      },
      keyframes: {
        idleBreathe: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1)' },
          '50%': { transform: 'scaleY(1.05) scaleX(0.97)' },
        },
        happyJump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        sleepZzz: {
          '0%, 100%': { opacity: '0.6', transform: 'translateY(0) rotate(-5deg)' },
          '50%': { opacity: '1', transform: 'translateY(-5px) rotate(5deg)' },
        },
        attackFlash: {
          '0%, 100%': { transform: 'translateX(0)', filter: 'brightness(1)' },
          '50%': { transform: 'translateX(8px)', filter: 'brightness(2)' },
        },
        evolveGlow: {
          '0%, 100%': { filter: 'brightness(1) blur(0px)', transform: 'scale(1)' },
          '50%': { filter: 'brightness(3) blur(2px)', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor' },
          '50%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' },
        },
        sadSway: {
          '0%, 100%': { transform: 'rotate(-4deg) translateY(0)' },
          '50%': { transform: 'rotate(4deg) translateY(2px)' },
        },
        sadDrop: {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '20%': { opacity: '1' },
          '80%': { opacity: '0.8' },
          '100%': { opacity: '0', transform: 'translateY(20px)' },
        },
        hungryDroop: {
          '0%, 100%': { transform: 'translateY(0) scaleY(1)' },
          '40%': { transform: 'translateY(4px) scaleY(0.95)' },
          '60%': { transform: 'translateY(4px) scaleY(0.95)' },
        },
        hungryCallout: {
          '0%, 100%': { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
          '50%': { opacity: '0.7', transform: 'translateX(-50%) translateY(-4px) scale(1.15)' },
        },
        criticalBlink: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.3', filter: 'brightness(1.8) saturate(0.5)' },
        },
        criticalWarn: {
          '0%, 100%': { opacity: '1', transform: 'translateX(-50%) scale(1)' },
          '50%': { opacity: '0.5', transform: 'translateX(-50%) scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
