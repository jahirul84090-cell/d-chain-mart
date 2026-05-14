import "./globals.css";
import { Jost, Roboto_Slab } from "next/font/google";
import Provider from "@/components/Provider";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-slab",
});

export const metadata = {
  title: "My Ecommerce Website",
  description: "Modern ecommerce frontend built with Next.js 15 and shadcn/ui",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased bg-background text-foreground ${jost.variable} ${robotoSlab.variable}`}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
