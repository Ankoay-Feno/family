import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import I18nProvider from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ProfileMenu from "@/components/ProfileMenu";
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
  const t = getDictionary(locale);
  return (
    <html lang={locale} className={`${fraunces.variable} ${instrumentSans.variable}`}>
      <body>
        <I18nProvider locale={locale}>
          {/* Barre fixe : la page commence dessous (padding-top du body), donc
              plus aucun chevauchement avec les titres, quelle que soit la largeur. */}
          <header className="topbar">
            <Link href="/" className="topbar-brand display">
              {t.common.appName}
            </Link>
            <div className="topbar-right">
              <ProfileMenu />
              <LanguageSwitcher />
            </div>
          </header>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
