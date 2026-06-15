import { Cairo, Poppins } from "next/font/google";

export const marketingCairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-marketing-cairo",
  display: "swap",
});

export const marketingPoppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-marketing-poppins",
  display: "swap",
});

export const marketingFontClassNames = `${marketingCairo.variable} ${marketingPoppins.variable}`;
