import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";

const MAPPLS_KEY = process.env.NEXT_PUBLIC_MAPPLS_KEY || "";

// Debug: Log the API key (remove in production)
if (typeof window === "undefined") {
  console.log("MAPPLS_KEY in layout:", MAPPLS_KEY);
}

export const metadata: Metadata = {
  title: "CivicConnect - Smart Civic Issue Reporting",
  description:
    "Report, Track & Resolve Civic Issues Together - Smart India Hackathon Project",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {MAPPLS_KEY && MAPPLS_KEY !== "" ? (
          <>
            <style
              dangerouslySetInnerHTML={{
                __html: `
                #report-map-container,
                #mappls-container,
                #admin-mappls-container {
                  width: 100%;
                  height: 100%;
                  min-height: 200px;
                }
              `,
              }}
            />
            <Script
              id="mappls-sdk"
              src={`https://apis.mappls.com/advancedmaps/api/${MAPPLS_KEY}/map_sdk?layer=vector&v=3.0`}
              strategy="beforeInteractive"
            />
          </>
        ) : (
          <div style={{ display: "none" }}>
            {/* Fallback: No Mappls SDK loaded */}
          </div>
        )}
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-screen flex flex-col`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
