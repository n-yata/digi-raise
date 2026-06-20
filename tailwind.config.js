/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    borderRadius: {
      'none': '0px',
      'sm':   '1px',
      DEFAULT: '2px',
      'md':   '2px',
      'lg':   '2px',
      'xl':   '2px',
      '2xl':  '2px',
      '3xl':  '2px',
      'full': '9999px',
    },
    extend: {
      fontFamily: {
        pixel: ['"DotGothic16"', 'monospace'],
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
      transitionDuration: {
        '150': '50ms',
      },
      animation: {
        'retro-blink': 'retroBlink 1s steps(1) infinite',
        'idle-breathe': 'idleBreathe 3s ease-in-out infinite',
        'happy-jump': 'happyJump 2.4s ease-in-out infinite',
        'attack-flash': 'attackFlash 0.3s ease-in-out 3',
        'attack-lunge': 'attackLunge 0.55s ease-in-out infinite',
        'eat-nod': 'eatNod 0.46s ease-in-out infinite',
        'evolve-glow': 'evolveGlow 0.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'sad-sway': 'sadSway 2.5s ease-in-out infinite',
        'sad-drop': 'sadDrop 2s ease-in infinite',
        'hungry-droop': 'hungryDroop 3s ease-in-out infinite',
        'hungry-callout': 'hungryCallout 1.2s ease-in-out infinite',
        'critical-blink': 'criticalBlink 1.6s ease-in-out infinite',
        'walk-bounce': 'walkBounce 0.55s ease-in-out infinite',
      },
      keyframes: {
        retroBlink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        idleBreathe: {
          '0%, 100%': { transform: 'scaleY(1) scaleX(1) translateY(0px)' },
          '35%': { transform: 'scaleY(1.04) scaleX(0.97) translateY(-2px)' },
          '65%': { transform: 'scaleY(1.06) scaleX(0.96) translateY(-2px)' },
          '80%': { transform: 'scaleY(1.02) scaleX(0.99) translateY(-1px)' },
        },
        happyJump: {
          '0%':   { transform: 'translateY(0) scaleX(1) scaleY(1)' },
          '5%':   { transform: 'translateY(3px) scaleX(1.22) scaleY(0.74)' },
          '14%':  { transform: 'translateY(-16px) scaleX(0.82) scaleY(1.24)' },
          '23%':  { transform: 'translateY(-19px) scaleX(0.88) scaleY(1.16)' },
          '31%':  { transform: 'translateY(-4px) scaleX(1.02) scaleY(0.99)' },
          '37%':  { transform: 'translateY(3px) scaleX(1.26) scaleY(0.7)' },
          '42%':  { transform: 'translateY(0) scaleX(1) scaleY(1)' },
          '100%': { transform: 'translateY(0) scaleX(1) scaleY(1)' },
        },
        sleepZzz: {
          '0%, 100%': { opacity: '0.6', transform: 'translateY(0) rotate(-5deg)' },
          '50%': { opacity: '1', transform: 'translateY(-5px) rotate(5deg)' },
        },
        attackFlash: {
          '0%, 100%': { transform: 'translateX(0)', filter: 'brightness(1)' },
          '50%': { transform: 'translateX(8px)', filter: 'brightness(2)' },
        },
        attackLunge: {
          '0%':   { transform: 'translateX(0) scaleX(1) scaleY(1)', filter: 'brightness(1)' },
          '20%':  { transform: 'translateX(-8px) scaleX(0.84) scaleY(1.14)', filter: 'brightness(1)' },
          '48%':  { transform: 'translateX(16px) scaleX(1.2) scaleY(0.82)', filter: 'brightness(2.2)' },
          '68%':  { transform: 'translateX(10px) scaleX(1.08) scaleY(0.93)', filter: 'brightness(1.4)' },
          '100%': { transform: 'translateX(0) scaleX(1) scaleY(1)', filter: 'brightness(1)' },
        },
        eatNod: {
          '0%':   { transform: 'translateY(0) scaleY(1) scaleX(1)' },
          '25%':  { transform: 'translateY(5px) scaleY(0.82) scaleX(1.16)' },
          '44%':  { transform: 'translateY(4px) scaleY(0.86) scaleX(1.12)' },
          '70%':  { transform: 'translateY(-3px) scaleY(1.1) scaleX(0.93)' },
          '100%': { transform: 'translateY(0) scaleY(1) scaleX(1)' },
        },
        walkBounce: {
          '0%':   { transform: 'translateY(0) rotate(-3.5deg)' },
          '25%':  { transform: 'translateY(-5px) rotate(0deg)' },
          '50%':  { transform: 'translateY(0) rotate(3.5deg)' },
          '75%':  { transform: 'translateY(-5px) rotate(0deg)' },
          '100%': { transform: 'translateY(0) rotate(-3.5deg)' },
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
          '50%': { opacity: '0.6', filter: 'brightness(1.3) saturate(0.7)' },
        },
      },
    },
  },
  plugins: [],
}
