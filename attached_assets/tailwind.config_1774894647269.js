// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF2D2D",
        dark: "#0D0D0D",
      },
      animation: {
        "pulse-once": "pulseOnce 1s ease-out 3",
        "slide-up": "slideUp 0.3s ease-out forwards",
      },
      keyframes: {
        pulseOnce: {
          "0%": { boxShadow: "0 0 0 0 rgba(251,191,36,0.6)" },
          "50%": { boxShadow: "0 0 0 16px rgba(251,191,36,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(251,191,36,0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
