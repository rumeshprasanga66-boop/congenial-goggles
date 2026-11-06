import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://naturalwrite.app"),
  title: {
    default: "NaturalWrite — Your ideas deserve better writing",
    template: "%s · NaturalWrite",
  },
  description:
    "Create thoughtful articles, clear business content and natural writing with an AI workspace built around your ideas.",
  applicationName: "NaturalWrite",
  keywords: [
    "AI writing",
    "writing assistant",
    "content creation",
    "copywriting",
    "document editor",
  ],
  openGraph: {
    type: "website",
    siteName: "NaturalWrite",
    title: "NaturalWrite — Your ideas deserve better writing",
    description:
      "Create thoughtful articles, clear business content and natural writing with an AI workspace built around your ideas.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaturalWrite — Your ideas deserve better writing",
    description:
      "Create thoughtful articles, clear business content and natural writing with an AI workspace built around your ideas.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-dvh bg-canvas font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-pop"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
