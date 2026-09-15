import type { Metadata } from "next";
import TabNav from "@/components/nav/TabNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Adjuster",
  description: "An interface for adjusting recipes with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TabNav />
        {children}
      </body>
    </html>
  );
}
