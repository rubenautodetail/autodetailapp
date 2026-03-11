import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getDictionary } from '@/lib/dictionaries';
import { getLandingContent, type Testimonial } from '@/lib/hygraph';
import { createClient } from '@/lib/supabase/server';
import { i18n } from '@/i18n-config';
import ZipChecker from '@/components/ZipChecker/ZipChecker';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

// ─── Fallback testimonials (used until HyGraph has data) ──────────────────────
const FALLBACK_TESTIMONIALS: Testimonial[] = [
    {
        authorName: 'Marcus T.',
        location: 'Miami, FL',
        rating: 5,
        text: "My car hasn't looked this good since I drove it off the lot. Rubens did an incredible job on the full detail.",
        vehicleType: '2022 BMW M3',
    },
    {
        authorName: 'Sofia R.',
        location: 'Coral Gables, FL',
        rating: 5,
        text: 'Booked online in 2 minutes, they showed up on time, and my SUV looks brand new. Absolutely worth every penny.',
        vehicleType: '2023 Range Rover Sport',
    },
    {
        authorName: 'James K.',
        location: 'Brickell, FL',
        rating: 5,
        text: 'The engine bay cleaning alone was worth it. These guys are true professionals. Booking monthly from now on.',
        vehicleType: '2021 Porsche 911 Carrera',
    },
];

export default async function LandingPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';

    // Server-side auth check — redirect logged-in users to dashboard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect(`/${locale}/dashboard`);

    const [dict, hygraph] = await Promise.all([
        getDictionary(locale),
        getLandingContent(locale),
    ]);

    // Merge HyGraph content with dictionary fallbacks
    const hero = {
        heading: hygraph.hero?.heading ?? dict.home.hero.title,
        subheading: hygraph.hero?.subheading ?? dict.home.hero.subtitle,
        badgeText: locale === 'es' ? 'Ahora disponible en Miami' : 'Now available in Miami',
    };

    const testimonials = hygraph.testimonials.length ? hygraph.testimonials : FALLBACK_TESTIMONIALS;

    const services = [
        { ...dict.home.services.interior, icon: '🪞' },
        { ...dict.home.services.exterior, icon: '✨' },
        { ...dict.home.services.full, icon: '🏆' },
    ];

    const steps = [
        { number: '01', ...dict.home.howItWorks.step1, icon: '📍' },
        { number: '02', ...dict.home.howItWorks.step2, icon: '🚐' },
        { number: '03', ...dict.home.howItWorks.step3, icon: '☕' },
    ];

    return (
        <div className="min-h-screen bg-[#131835] text-white overflow-x-hidden">
            {/* ─── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
                {/* Gold radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(208, 176, 120, 0.18) 0%, transparent 70%)',
                    }}
                />
                {/* Subtle grid */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 text-[#D0B078] text-xs font-medium tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D0B078] animate-pulse" />
                        {hero.badgeText}
                    </div>

                    {/* Heading */}
                    <h1
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        {hero.heading.split(' ').map((word, i, arr) =>
                            i >= arr.length - 2 ? (
                                <span key={i} className="text-gold-gradient">{word}{i < arr.length - 1 ? ' ' : ''}</span>
                            ) : (
                                <span key={i}>{word} </span>
                            )
                        )}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg text-white/50 font-light max-w-md mx-auto leading-relaxed">
                        {hero.subheading}
                    </p>

                    {/* ZIP Checker */}
                    <div className="w-full max-w-lg mx-auto">
                        <ZipChecker dict={dict.zipChecker} lang={locale} />
                    </div>

                    {/* Auth links */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <span className="text-white/30 text-sm">Already a member?</span>
                        <Link
                            href={`/${locale}/login`}
                            className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4"
                        >
                            {locale === 'es' ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
                    <span className="text-xs tracking-widest uppercase">{locale === 'es' ? 'Desplázate' : 'Scroll'}</span>
                    <div className="w-px h-8 bg-white/40 animate-pulse" />
                </div>
            </section>

            {/* ─── Stats ─────────────────────────────────────────────────────── */}
            <section className="border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 gap-4 text-center">
                    {[
                        { value: '2,400+', label: locale === 'es' ? 'Detalles completados' : 'Details completed' },
                        { value: '4.97', label: locale === 'es' ? 'Calificación promedio' : 'Average rating' },
                        { value: '1', label: locale === 'es' ? 'Ciudad servida' : 'City served' },
                    ].map((stat) => (
                        <div key={stat.label} className="space-y-1">
                            <div className="text-3xl sm:text-4xl font-bold text-gold-gradient">{stat.value}</div>
                            <div className="text-xs text-white/40 tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── How It Works ───────────────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'El proceso' : 'The process'}
                        </p>
                        <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.howItWorks.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className="glass-card rounded-2xl p-8 space-y-4 group hover:border-[#D0B078]/20 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-4xl">{step.icon}</span>
                                    <span className="text-5xl font-bold text-white/5 group-hover:text-[#D0B078]/10 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                                        {step.number}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                    {step.title}
                                </h3>
                                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Services ───────────────────────────────────────────────────── */}
            <section className="py-24 px-6 bg-white/[0.015]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'Nuestros servicios' : 'Our services'}
                        </p>
                        <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.services.title}
                        </h2>
                        <p className="text-white/40 text-sm">{dict.home.services.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {services.map((service, i) => (
                            <div
                                key={service.title}
                                className={`glass-card rounded-2xl p-8 space-y-5 flex flex-col ${i === 2 ? 'ring-1 ring-[#D0B078]/30' : ''}`}
                            >
                                {i === 2 && (
                                    <div className="inline-flex self-start px-2.5 py-0.5 rounded-full bg-[#D0B078]/10 text-[#D0B078] text-xs font-medium tracking-wide">
                                        {locale === 'es' ? 'Más popular' : 'Most popular'}
                                    </div>
                                )}
                                <span className="text-4xl">{service.icon}</span>
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                        {service.title}
                                    </h3>
                                    <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[#D0B078] font-semibold">{service.price}</span>
                                    <Link
                                        href={`/${locale}/booking/select`}
                                        className="text-xs text-white/40 hover:text-white transition-colors"
                                    >
                                        {dict.common.bookNow} →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Testimonials ───────────────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16 space-y-3">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {locale === 'es' ? 'Clientes satisfechos' : 'Happy clients'}
                        </p>
                        <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {dict.home.testimonials.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t) => (
                            <div key={t.authorName} className="glass-card rounded-2xl p-7 space-y-5">
                                {/* Stars */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.rating }).map((_, i) => (
                                        <span key={i} className="text-[#D0B078] text-sm">★</span>
                                    ))}
                                </div>
                                <p className="text-white/70 text-sm leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                                <div className="pt-2 border-t border-white/5 space-y-0.5">
                                    <p className="font-semibold text-sm">{t.authorName}</p>
                                    <p className="text-white/30 text-xs">{t.vehicleType} · {t.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ───────────────────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center space-y-8">
                    <div
                        className="rounded-3xl p-12 space-y-6 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(208, 176, 120, 0.08) 0%, rgba(208, 176, 120, 0.02) 100%)',
                            border: '1px solid rgba(208, 176, 120, 0.15)',
                        }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(208, 176, 120, 0.12) 0%, transparent 70%)',
                            }}
                        />
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                                {locale === 'es'
                                    ? 'Tu auto merece lo mejor.'
                                    : 'Your car deserves the best.'}
                            </h2>
                            <p className="text-white/50 leading-relaxed">
                                {locale === 'es'
                                    ? 'Reserva en 2 minutos. Sin contratos. Sin sorpresas.'
                                    : 'Book in 2 minutes. No contracts. No surprises.'}
                            </p>
                        </div>
                        <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={`/${locale}/booking/select`}
                                className="btn-primary inline-block px-8 py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)]"
                            >
                                {dict.common.bookNow}
                            </Link>
                            <Link
                                href={`/${locale}/register`}
                                className="inline-block px-8 py-4 rounded-xl font-semibold text-sm tracking-wide border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                            >
                                {dict.common.getStarted}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────────────────── */}
            <footer className="border-t border-white/5 py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-xs">
                    <p>{dict.common.siteName} © {new Date().getFullYear()}</p>
                    <div className="flex gap-6">
                        <Link href={`/${locale}/terms`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Términos' : 'Terms'}
                        </Link>
                        <Link href={`/${locale}/privacy`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Privacidad' : 'Privacy'}
                        </Link>
                        <Link href={`/${locale}/login`} className="hover:text-white/60 transition-colors">
                            {locale === 'es' ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
