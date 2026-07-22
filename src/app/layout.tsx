import type { Metadata } from "next";
import { Rubik, Lora } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Gitfriend — Chat with any GitHub repo",
  description:
    "Paste a repo, ask it anything. Gitfriend indexes any codebase so you can ask how it works instead of reading it line by line.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rubik.variable} ${lora.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}