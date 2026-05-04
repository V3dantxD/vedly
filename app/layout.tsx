import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "Vedly — Split expenses, not friendships",
  description: "Track shared expenses, split bills, and settle up with friends and groups.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1e2535",
                color: "#f0f4ff",
                border: "1px solid #2a3347",
                borderRadius: "10px",
                fontFamily: "DM Sans, sans-serif",
              },
              success: { iconTheme: { primary: "#5BC5A7", secondary: "#0f1117" } },
              error: { iconTheme: { primary: "#f87171", secondary: "#0f1117" } },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
