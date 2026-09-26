import "./globals.css";
import { Jost, Roboto_Slab } from "next/font/google";
import Provider from "@/components/Provider";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} — Online Shopping in Bangladesh`,
  },
  description:
    "Shop mobiles, laptops, electronics and more online in Bangladesh with fast delivery, cash on delivery and EMI.",
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2ea7f2",
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
