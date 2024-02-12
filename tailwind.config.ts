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
    },
  },
  plugins: [tailwindScrollbarPlugin],
} satisfies Config;
