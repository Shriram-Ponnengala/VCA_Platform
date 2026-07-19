import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";
import BrandingProvider from "@/components/providers/BrandingProvider";

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
    <html lang="en">
      <head>
        <Script
          id="perf-silencer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
                  const originalMeasure = window.performance.measure;
                  window.performance.measure = function (name, ...args) {
                    try {
                      return originalMeasure.call(window.performance, name, ...args);
                    } catch (e) {
                      // Silence negative timestamp/measure errors in Next.js/Turbopack dev mode
                    }
                  };
                }
              })();
            `
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&family=Oleo+Script:wght@400;700&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap" rel="stylesheet" />
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
