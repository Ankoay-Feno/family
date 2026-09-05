import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import I18nProvider from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fianakaviana",
  description: "L'arbre de la famille — comptes, photos et générations.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <body>
        <I18nProvider locale={locale}>
          <div className="lang-switcher-slot">
            <LanguageSwitcher />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
