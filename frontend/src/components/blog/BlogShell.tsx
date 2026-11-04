import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import LanguageSwitch from "@/components/landing/LanguageSwitch";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const SITE_NAME = "Lux Auto Detail Services";
const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D0B078] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131835]";

/** Header and footer shared by the blog pages (same look as the service pages). */
export default function BlogShell({
    locale,
    switchHref,
    children,
}: {
    locale: "en" | "es";
    /** The same page in the other language. */
    switchHref: string;
    children: ReactNode;
}) {
    const isEs = locale === "es";
    const waText = encodeURIComponent(isEs ? "Hola, tengo una pregunta." : "Hi, I have a question.");
    const waHref = WHATSAPP ? `https://wa.me/${WHATSAPP}?text=${waText}` : null;

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            <header className="border-b border-white/5">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
                    <Link
                        href={`/${locale}`}
                        aria-label={isEs ? "Ir al inicio" : "Go to home"}
                        className={`rounded ${focusRing}`}
                    >
                        <Image
                            src="/dtailwash_logo_final.png"
                            alt={SITE_NAME}
                            width={1942}
                            height={809}
                            className="h-11 w-auto sm:h-14"
                        />
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <LanguageSwitch locale={locale} href={switchHref} />
                        {waHref && (
                            <a
                                href={waHref}
                                className={`hidden rounded-full bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:inline-block ${focusRing}`}
                            >
                                WhatsApp
                            </a>
                        )}
                        <Link
                            href={`/${locale}/booking/select`}
                            className={`rounded-full bg-[#D0B078] px-5 py-2 text-sm font-semibold text-[#131835] transition-colors hover:bg-[#dcc08d] ${focusRing}`}
                        >
                            {isEs ? "Reservar" : "Book now"}
                        </Link>
                    </div>
                </div>
            </header>

            <main>{children}</main>

            <footer className="border-t border-white/5 px-6 py-8 text-xs text-white/55">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {SITE_NAME}
                    </p>
                    <div className="flex gap-6">
                        <Link href={`/${locale}`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Inicio" : "Home"}
                        </Link>
                        <Link href={`/${locale}/blog`} className={`hover:text-white ${focusRing}`}>
                            Blog
                        </Link>
                        <Link href={`/${locale}/terms`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Términos" : "Terms"}
                        </Link>
                        <Link href={`/${locale}/privacy`} className={`hover:text-white ${focusRing}`}>
                            {isEs ? "Privacidad" : "Privacy"}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
