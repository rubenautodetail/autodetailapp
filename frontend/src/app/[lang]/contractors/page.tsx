import Link from 'next/link';
import Image from 'next/image';
import { i18n } from '@/i18n-config';
import { getContractorLandingContent } from '@/lib/hygraph';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

const PERKS = [
    {
        icon: '🚀',
        en: { title: 'More Clients, More Revenue', desc: 'Get connected with customers in your area and build a steady stream of bookings.' },
        es: { title: 'Más Clientes, Más Ingresos', desc: 'Conéctate con clientes en tu área y construye un flujo constante de reservas.' },
    },
    {
        icon: '📅',
        en: { title: 'Work Your Own Schedule', desc: 'Accept jobs when you want. No minimums, no mandatory hours.' },
        es: { title: 'Tu Horario, Tus Reglas', desc: 'Acepta trabajos cuando quieras. Sin mínimos ni horarios obligatorios.' },
    },
    {
        icon: '📍',
        en: { title: 'Jobs Come to You', desc: 'Get notified of new jobs in your service area the moment they are booked.' },
        es: { title: 'Los Trabajos Llegan a Ti', desc: 'Recibe alertas de nuevos trabajos en tu área en cuanto se reserven.' },
    },
    {
        icon: '⚡',
        en: { title: 'Fast Payouts', desc: 'Get paid weekly via Zelle, ACH, or check — fast and reliable.' },
        es: { title: 'Pagos Rápidos', desc: 'Recibe pagos semanales vía Zelle, ACH o cheque — rápido y confiable.' },
    },
    {
        icon: '🛡️',
        en: { title: 'We Handle the Platform', desc: 'No chasing clients. We manage booking, payment, and customer support.' },
        es: { title: 'Nosotros Gestionamos la Plataforma', desc: 'Sin perseguir clientes. Nosotros manejamos reservas, pagos y soporte.' },
    },
    {
        icon: '📈',
        en: { title: 'Grow Your Business', desc: 'Build reputation through reviews. Top contractors get priority job offers.' },
        es: { title: 'Haz Crecer Tu Negocio', desc: 'Construye tu reputación con reseñas. Los mejores reciben trabajos prioritarios.' },
    },
];

const REQUIREMENTS = [
    { en: "Valid driver's license", es: 'Licencia de conducir válida' },
    { en: 'Proof of vehicle insurance', es: 'Comprobante de seguro vehicular' },
    { en: 'Business or occupational license', es: 'Licencia de negocio u ocupacional' },
    { en: 'Own detailing equipment & supplies', es: 'Equipo y suministros de detallado propios' },
    { en: 'Service area in Miami-Dade County', es: 'Área de servicio en Miami-Dade County' },
];

export default async function ContractorsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const locale = i18n.locales.includes(lang as 'en' | 'es') ? (lang as 'en' | 'es') : 'en';
    const isEs = locale === 'es';

    // Fetch CMS content from Hygraph
    const hygraph = await getContractorLandingContent(locale);
    const heroImage = hygraph.hero?.heroImageUrl ?? null;
    const cmsHeading = hygraph.hero?.heading ?? null;
    const cmsSubheading = hygraph.hero?.subheading ?? null;
    const galleryImages = hygraph.galleryImages ?? [];

    return (
        <div className="min-h-screen bg-[#131835] text-white overflow-x-hidden">
            {/* ─── Nav ──────────────────────────────────────────────────────── */}
            <nav className="border-b border-white/5 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                        <Image src="/dtailwash_logo_final.png" alt="DetailWash" width={486} height={130} className="w-auto h-16 sm:h-24 opacity-100 drop-shadow-md" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/${locale}/contractor/login`}
                            className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                            {isEs ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                        <Link
                            href={`/${locale}/register?next=/${locale}/contractors/apply`}
                            className="px-4 py-2 text-sm font-semibold bg-[#D0B078] text-black rounded-lg hover:bg-[#c4a068] transition-colors"
                        >
                            {isEs ? 'Aplicar ahora' : 'Apply now'}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative py-14 sm:py-24 px-6 overflow-hidden">
                {/* Hero background image from Hygraph */}
                {heroImage && (
                    <Image
                        src={heroImage}
                        alt="Contractor hero"
                        fill
                        priority
                        className="object-cover object-center opacity-15"
                        sizes="100vw"
                    />
                )}
                <div
                    className="absolute inset-0 pointer-events-none z-[1]"
                    style={{
                        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(208,176,120,0.14) 0%, transparent 65%)',
                    }}
                />
                <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D0B078]/30 bg-[#D0B078]/5 text-[#D0B078] text-xs font-medium tracking-widest uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D0B078] animate-pulse" />
                        {isEs ? 'Únete al equipo' : 'Join the team'}
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {cmsHeading
                            ? <><span className="text-gold-gradient">{cmsHeading}</span></>
                            : isEs
                                ? <>Gana dinero haciendo<br /><span className="text-gold-gradient">lo que ya sabes hacer.</span></>
                                : <>Get paid to do<br /><span className="text-gold-gradient">what you already do.</span></>}
                    </h1>
                    <p className="text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
                        {isEs
                            ? 'Conviértete en un detallador certificado en la plataforma DTailWash. Tú traes el talento, nosotros traemos los clientes.'
                            : 'Become a certified detailer on the DTailWash platform. You bring the skill, we bring the customers.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Link
                            href={`/${locale}/register?next=/${locale}/contractors/apply`}
                            className="btn-primary px-8 py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)]"
                        >
                            {isEs ? 'Crea tu cuenta y aplica' : 'Create account & apply'}
                        </Link>
                        <Link
                            href={`/${locale}/contractor/login`}
                            className="px-8 py-4 rounded-xl font-semibold text-sm tracking-wide border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            {isEs ? 'Ya tengo cuenta →' : 'Already have an account →'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Gallery Strip ────────────────────────────────────────────── */}
            {galleryImages.length > 0 && (
                <section className="py-8 px-6 bg-white/[0.015]">
                    <div className="max-w-5xl mx-auto">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium text-center mb-5">
                            {isEs ? 'Nuestro equipo en acción' : 'Our team in action'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {galleryImages.map((img) => (
                                <div key={img.imageUrl} className="relative aspect-[4/3] rounded-xl overflow-hidden group">
                                    <Image
                                        src={img.imageUrl}
                                        alt={img.caption}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                        <span className="text-white text-xs font-medium">{img.caption}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Perks ─────────────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 px-6 bg-white/[0.015]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14 space-y-2">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {isEs ? 'Beneficios' : 'Why join us'}
                        </p>
                        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {isEs ? 'Trabaja en tus términos.' : 'Work on your terms.'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {PERKS.map((perk) => {
                            const content = isEs ? perk.es : perk.en;
                            return (
                                <div key={perk.icon} className="glass-card rounded-2xl p-7 space-y-3">
                                    <span className="text-3xl">{perk.icon}</span>
                                    <h3 className="font-semibold text-base">{content.title}</h3>
                                    <p className="text-white/65 text-sm leading-relaxed">{content.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── How it works ──────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14 space-y-2">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {isEs ? 'El proceso' : 'How it works'}
                        </p>
                        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {isEs ? '3 pasos para empezar' : '3 steps to get started'}
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            {
                                n: '01',
                                en: { t: 'Create your account', d: 'Register with your email and password. Takes 60 seconds.' },
                                es: { t: 'Crea tu cuenta', d: 'Regístrate con tu correo y contraseña. Tarda 60 segundos.' },
                            },
                            {
                                n: '02',
                                en: { t: 'Submit your application', d: 'Upload your license, insurance, and a few details about your business.' },
                                es: { t: 'Envía tu solicitud', d: 'Sube tu licencia, seguro y detalles de tu negocio.' },
                            },
                            {
                                n: '03',
                                en: { t: 'Get approved & start earning', d: 'We review in 1–2 business days. Once approved, set up your profile and start accepting jobs.' },
                                es: { t: 'Aprobación y a ganar', d: 'Revisamos en 1–2 días hábiles. Una vez aprobado, configura tu perfil y empieza a aceptar trabajos.' },
                            },
                        ].map((step) => {
                            const c = isEs ? step.es : step.en;
                            return (
                                <div key={step.n} className="glass-card rounded-2xl p-6 flex items-start gap-5">
                                    <span className="text-4xl font-bold text-[#D0B078]/20 shrink-0 leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                                        {step.n}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-base mb-1">{c.t}</h3>
                                        <p className="text-white/65 text-sm leading-relaxed">{c.d}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─── Requirements ──────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 px-6 bg-white/[0.015]">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10 space-y-2">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {isEs ? 'Requisitos' : 'Requirements'}
                        </p>
                        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {isEs ? '¿Qué necesitas?' : 'What do you need?'}
                        </h2>
                    </div>
                    <div className="glass-card rounded-2xl p-8 space-y-4">
                        {REQUIREMENTS.map((req) => (
                            <div key={req.en} className="flex items-start gap-3">
                                <span className="text-[#D0B078] mt-0.5 shrink-0">✓</span>
                                <p className="text-white/70 text-sm">{isEs ? req.es : req.en}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Final CTA ─────────────────────────────────────────────────── */}
            <section className="py-14 sm:py-24 px-6">
                <div className="max-w-xl mx-auto text-center space-y-6">
                    <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                        {isEs ? '¿Listo para empezar?' : 'Ready to get started?'}
                    </h2>
                    <p className="text-white/65 text-sm">
                        {isEs
                            ? 'Crea tu cuenta, envía tu solicitud y empieza a ganar.'
                            : 'Create your account, submit your application, and start earning.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href={`/${locale}/register?next=/${locale}/contractors/apply`}
                            className="btn-primary px-8 py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)]"
                        >
                            {isEs ? 'Aplicar ahora' : 'Apply now'}
                        </Link>
                        <Link
                            href={`/${locale}/contractor/login`}
                            className="px-8 py-4 rounded-xl font-semibold text-sm tracking-wide border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                            {isEs ? 'Ya tengo cuenta' : 'I have an account'}
                        </Link>
                    </div>
                    <p className="text-white/50 text-xs">
                        {isEs ? 'Aplicación gratuita · Sin compromisos' : 'Free to apply · No commitment'}
                    </p>
                </div>
            </section>

            {/* ─── Footer ────────────────────────────────────────────────────── */}
            <footer className="border-t border-white/5 py-8 px-6">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/55 text-xs">
                    <div className="flex flex-col items-center sm:items-start gap-3">
                        <Image src="/dtailwash_logo_final.png" alt="DetailWash" width={365} height={97} className="w-auto h-16 sm:h-20 opacity-70" />
                        <p>© {new Date().getFullYear()}</p>
                        <p>
                            {isEs ? 'Diseñado por' : 'Designed by'}{' '}
                            <span className="text-white/45 font-medium">OAC Digital Innovations</span>
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <Link href={`/${locale}`} className="hover:text-white/60 transition-colors">
                            ← {isEs ? 'Volver al inicio' : 'Back to home'}
                        </Link>
                        <Link href={`/${locale}/contractor/login`} className="hover:text-white/60 transition-colors">
                            {isEs ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
