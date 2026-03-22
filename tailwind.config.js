const { heroui } = require("@heroui/react");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern:
        /^(bg|text|border|ring)-(primary|secondary|success|warning|danger|default)(-\d+)?$/,
    },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf9",
          100: "#ccfbef",
          200: "#99f5df",
          300: "#5eeac9",
          400: "#2dd4b0",
          500: "#14b897",
          600: "#0d937b",
          700: "#0e7663",
          800: "#105e50",
          900: "#114e43",
          950: "#042e28",
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: "#14b897",
              foreground: "#ffffff",
              50: "#f0fdf9",
              100: "#ccfbef",
              200: "#99f5df",
              300: "#5eeac9",
              400: "#2dd4b0",
              500: "#14b897",
              600: "#0d937b",
              700: "#0e7663",
              800: "#105e50",
              900: "#114e43",
            },
          },
        },
      },
    }),
  ],
};