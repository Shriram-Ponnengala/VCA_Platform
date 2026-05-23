import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Sans, Montserrat, Poppins, Roboto } from "next/font/google";
import "./globals.css";
import BrandingProvider from "@/components/providers/BrandingProvider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", weight: ["300", "400", "500", "600", "700"], subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", weight: ["300", "400", "500", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Venture Chess Academy | Attendance Management",
  description: "Attendance management system for Venture Chess Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${montserrat.variable} ${poppins.variable} ${roboto.variable}`}>
      <body suppressHydrationWarning>
        <BrandingProvider />
        {children}
      </body>
    </html>
  );
}
