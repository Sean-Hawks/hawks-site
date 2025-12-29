import type { Config } from "tailwindcss";

const config: Config = {
  // ...existing code...
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;