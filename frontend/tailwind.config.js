/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12161C",       // app chrome background
        panel: "#1C222B",     // card / panel surface
        line: "#3E4A5C",      // hairline dividers, borders
        text: {
          DEFAULT: "#EDEFF2",
          muted: "#8D97A6",
        },
        signal: {
          amber: "#E8A23D",   // primary action / warehouse-signage accent
          amberDim: "#B87F2E",
        },
        status: {
          pass: "#4C9A6A",
          fail: "#C4463A",
          review: "#D9A441",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
      },
    },
  },
  plugins: [],
};