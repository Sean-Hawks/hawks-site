import localFont from "next/font/local";

export const displayFont = localFont({
  src: [
    {
      path: "../../public/fonts/rajdhani/Rajdhani-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/rajdhani/Rajdhani-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});
