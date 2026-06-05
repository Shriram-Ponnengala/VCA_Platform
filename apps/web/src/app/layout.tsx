import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Sans, Montserrat, Poppins, Roboto, Open_Sans, Oleo_Script, Lato, Merriweather, Nunito } from "next/font/google";
import "./globals.css";
import BrandingProvider from "@/components/providers/BrandingProvider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", weight: ["300", "400", "500", "600", "700"], subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", weight: ["300", "400", "500", "700"], subsets: ["latin"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });
const oleoScript = Oleo_Script({ variable: "--font-oleo-script", weight: ["400", "700"], subsets: ["latin"] });
const lato = Lato({ variable: "--font-lato", weight: ["300", "400", "700", "900"], subsets: ["latin"] });
const merriweather = Merriweather({ variable: "--font-merriweather", weight: ["300", "400", "700", "900"], subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Venture Chess Academy | Management Portal",
  description: "Management portal for Venture Chess Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${montserrat.variable} ${poppins.variable} ${roboto.variable} ${openSans.variable} ${oleoScript.variable} ${lato.variable} ${merriweather.variable} ${nunito.variable}`}>
      <head>
        <link
          id="branding-css-link"
          rel="stylesheet"
          href="/api/settings/branding/css"
        />
      </head>
      <body suppressHydrationWarning>
        <BrandingProvider />
        {children}
      </body>
    </html>
  );
}
