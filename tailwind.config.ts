import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindScrollbarPlugin from "tailwind-scrollbar";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        spotify: "#1DB954",
        black: "#121212",
      },
      animation: {
        "boob-once": "boop 0.3s ease-out",
        "-boob-once": "minusboop 0.3s ease-out",
      },
      keyframes: {
        boop: {
          "0%, 100%": { scale: "1" },
          "30%": { scale: "1.2" },
        },
        minusboop: {
          "0%, 100%": { scale: "1" },
          "30%": { scale: "0.8" },
        },
      },
    },
  },
  plugins: [tailwindScrollbarPlugin],
} satisfies Config;
