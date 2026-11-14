import Link from 'next/link';
import LanguageSwitch from '@/components/landing/LanguageSwitch';
import Image from 'next/image';
import { i18n } from '@/i18n-config';
import { getContractorLandingContent } from '@/lib/hygraph';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const isEs = lang === 'es';

    return {
        title: isEs ? 'Trabajo de Detailing a Domicilio' : 'Car Detailing Jobs Near You',
        description: isEs
            ? 'Únete a Lux como detallador de autos móvil. Trabajos cerca de ti, tu propio horario y pago 1 a 2 días después de cada trabajo aprobado. Hoy en Florida.'
            : 'Join Lux as a mobile car detailer. Jobs near you, your own schedule and payment 1–2 days after each approved job. Now in Florida.',
        alternates: {
            canonical: `/${lang}/contractors`,
            languages: { en: '/en/contractors', es: '/es/contractors' },
        },
    };
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
        en: { title: 'Jobs Come to You', desc: 'You get an email for every new job in your area.' },
        es: { title: 'Los Trabajos Llegan a Ti', desc: 'Te llega un correo con cada trabajo nuevo en tu área.' },
    },
    {
        icon: '⚡',
        en: { title: 'Paid in 1–2 Days', desc: 'By bank transfer or Zelle, after the job is approved.' },
        es: { title: 'Pago en 1 a 2 Días', desc: 'Por transferencia o Zelle, después de que el trabajo es aprobado.' },
    },
    {
        icon: '🛡️',
        en: { title: 'We Handle the Platform', desc: 'No chasing clients. We manage booking, payment, and customer support.' },
        es: { title: 'Nosotros Gestionamos la Plataforma', desc: 'Sin perseguir clientes. Nosotros manejamos reservas, pagos y soporte.' },
    },
    {
        icon: '📈',
        en: { title: 'Grow Your Business', desc: 'Every customer review adds to your reputation.' },
        es: { title: 'Haz Crecer Tu Negocio', desc: 'Cada reseña de un cliente suma a tu reputación.' },
    },
];

const REQUIREMENTS = [
    { en: 'Car detailing experience', es: 'Experiencia en detallado de autos' },
    { en: "Valid driver's license", es: 'Licencia de conducir válida' },
    { en: 'Proof of vehicle insurance', es: 'Comprobante de seguro vehicular' },
    { en: 'Business or occupational license', es: 'Licencia de negocio u ocupacional' },
    { en: 'Own detailing equipment and supplies, including a generator and water', es: 'Equipo y productos de detallado propios, con generador y agua' },
    { en: 'Live or work where we operate (now Florida)', es: 'Vivir o trabajar donde operamos (hoy Florida)' },
    { en: '18 or older', es: 'Mayor de 18 años' },
];

const FAQS = [
    {
        en: { q: 'How do I get jobs?', a: 'You get an email for every new job in your area and you decide whether to take it. No minimums or mandatory hours.' },
        es: { q: '¿Cómo me llegan los trabajos?', a: 'Te llega un correo con cada trabajo nuevo en tu área y tú decides si lo aceptas. No hay mínimos ni horarios obligatorios.' },
    },
    {
        en: { q: 'When do I get paid?', a: '1–2 days after the job is approved, by bank transfer or Zelle.' },
        es: { q: '¿Cuándo me pagan?', a: 'Entre 1 y 2 días después de que el trabajo es aprobado, por transferencia o Zelle.' },
    },
    {
        en: { q: 'What equipment do I need?', a: "Your own detailing equipment and products, a generator and water. Our customers don't have to provide anything: we arrive equipped." },
        es: { q: '¿Qué equipo necesito?', a: 'Tu propio equipo y productos de detallado, generador y agua. Nuestros clientes no tienen que darnos nada: llegamos equipados.' },
    },
    {
        en: { q: 'How long does approval take?', a: "1–3 days. We contact you so you can share photos of your work equipment, then we talk with you by phone. You can apply before you have all the equipment, but we can't approve the application without it." },
        es: { q: '¿Cuánto tarda la aprobación?', a: 'De 1 a 3 días. Te contactamos para que nos compartas fotos de tu equipo de trabajo y después hablamos contigo por teléfono. Puedes aplicar aunque todavía no tengas todo el equipo, pero sin él no podemos aprobar la solicitud.' },
    },
    {
        en: { q: 'Do I need experience?', a: 'Yes. You need car detailing experience. We talk about it with you on the phone before approving your application.' },
        es: { q: '¿Necesito experiencia?', a: 'Sí. Necesitas experiencia en detallado de autos. Lo hablamos contigo por teléfono antes de aprobar tu solicitud.' },
    },
    {
        en: { q: 'Am I an employee or an independent contractor?', a: 'You work as an independent contractor: you set your own schedule, choose which jobs to take and use your own equipment.' },
        es: { q: '¿Soy empleado o contratista independiente?', a: 'Trabajas como contratista independiente: tú decides tu horario, qué trabajos aceptar y usas tu propio equipo.' },
    },
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

    return (
        <div className="min-h-screen bg-[#131835] text-white overflow-x-hidden">
            {/* ─── Nav ──────────────────────────────────────────────────────── */}
            <nav className="border-b border-white/5 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                        <Image src="/dtailwash_logo_final.png" alt="Lux Auto Detail Services" width={1942} height={809} className="w-auto h-11 sm:h-14 opacity-100 drop-shadow-md" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitch locale={locale} href={`/${locale === 'es' ? 'en' : 'es'}/contractors`} />
                        <Link
                            href={`/${locale}/contractor/login`}
                            className="hidden sm:inline text-sm text-white/50 hover:text-white transition-colors whitespace-nowrap"
                        >
                            {isEs ? 'Iniciar sesión' : 'Log in'}
                        </Link>
                        <Link
                            href={`/${locale}/contractors/apply`}
                            className="px-4 py-2 text-sm font-semibold bg-[#D0B078] text-black rounded-lg hover:bg-[#c4a068] transition-colors whitespace-nowrap"
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
                        alt={isEs ? "Detallador de autos móvil lavando un carro a domicilio" : "Mobile car detailer washing a car at a customer's home"}
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
                            ? 'Nuestros clientes confían en Lux porque cuidamos cada carro como propio. ¿Trabajas igual? Queremos conocerte.'
                            : 'Our customers trust Lux because we care for every car like our own. Do you work the same way? We\'d like to meet you.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                        <Link
                            href={`/${locale}/contractors/apply`}
                            className="btn-primary px-8 py-4 rounded-xl font-semibold text-sm tracking-wide shadow-[var(--shadow-glow)]"
                        >
                            {isEs ? 'Aplicar ahora' : 'Apply now'}
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

            {/* ─── Perks ─────────────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 px-6 bg-white/[0.015]">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-14 space-y-2">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {isEs ? 'Beneficios' : 'Why join us'}
                        </p>
                        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {isEs ? 'Trabajo de detailing a tu manera.' : 'Car detailing jobs on your terms.'}
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
                                en: { t: 'Fill out the form', d: 'Your details, your area and how you want to get paid. Confirm your email with a code.' },
                                es: { t: 'Llena el formulario', d: 'Tus datos, tu zona y cómo quieres cobrar. Confirmas tu correo con un código.' },
                            },
                            {
                                n: '02',
                                en: { t: 'We contact you', d: 'Have photos of your equipment ready: generator, water, machines and products.' },
                                es: { t: 'Te contactamos', d: 'Ten listas las fotos de tu equipo: generador, agua, máquinas y productos.' },
                            },
                            {
                                n: '03',
                                en: { t: 'Call and approval', d: 'Once we see the photos, we talk with you by phone. Approval in 1–3 days.' },
                                es: { t: 'Llamada y aprobación', d: 'Con las fotos, hablamos contigo por teléfono. Aprobación en 1 a 3 días.' },
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

            {/* ─── FAQ ───────────────────────────────────────────────────────── */}
            <section className="py-12 sm:py-20 px-6">
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'JobPosting',
                            title: isEs
                                ? 'Detallador de Autos a Domicilio (Contratista Independiente)'
                                : 'Mobile Car Detailer (Independent Contractor)',
                            description: isEs
                                ? '<p>Lux Auto Detail Services busca detalladores de autos con experiencia para trabajar a domicilio como contratistas independientes.</p><ul><li>Recibes por correo los trabajos nuevos de tu zona y decides cuáles aceptar.</li><li>Sin mínimos ni horarios obligatorios.</li><li>Pago 1 a 2 días después de que el trabajo es aprobado, por transferencia o Zelle.</li><li>Nosotros manejamos reservas, cobros y atención al cliente.</li></ul><p>Requisitos: experiencia en detallado de autos, licencia de conducir válida, seguro del vehículo, licencia de negocio u ocupacional, equipo y productos propios con generador y agua, y ser mayor de 18 años.</p>'
                                : '<p>Lux Auto Detail Services is looking for experienced car detailers to work at customers\' homes as independent contractors.</p><ul><li>Get an email for every new job in your area and choose which ones to take.</li><li>No minimums or mandatory hours.</li><li>Paid 1–2 days after the job is approved, by bank transfer or Zelle.</li><li>We handle bookings, payments and customer support.</li></ul><p>Requirements: car detailing experience, a valid driver\'s license, vehicle insurance, a business or occupational license, your own equipment and products including a generator and water, and being 18 or older.</p>',
                            datePosted: '2026-11-13',
                            employmentType: 'CONTRACTOR',
                            directApply: true,
                            hiringOrganization: {
                                '@type': 'Organization',
                                name: 'Lux Auto Detail Services',
                                sameAs: 'https://www.dtailwash.com',
                                logo: 'https://www.dtailwash.com/dtailwash_logo_final.png',
                            },
                            jobLocation: {
                                '@type': 'Place',
                                address: {
                                    '@type': 'PostalAddress',
                                    addressLocality: 'Miami',
                                    addressRegion: 'FL',
                                    addressCountry: 'US',
                                },
                            },
                        }),
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'FAQPage',
                            mainEntity: FAQS.map((f) => {
                                const c = isEs ? f.es : f.en;
                                return { '@type': 'Question', name: c.q, acceptedAnswer: { '@type': 'Answer', text: c.a } };
                            }),
                        }),
                    }}
                />
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10 space-y-2">
                        <p className="text-[#D0B078] text-xs tracking-widest uppercase font-medium">
                            {isEs ? 'Preguntas frecuentes' : 'FAQ'}
                        </p>
                        <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                            {isEs ? 'Lo que suelen preguntar' : 'What detailers ask'}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {FAQS.map((f) => {
                            const c = isEs ? f.es : f.en;
                            return (
                                <details key={f.en.q} className="glass-card rounded-2xl p-5 group">
                                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-base">
                                        {c.q}
                                        <span className="text-[#D0B078] shrink-0 transition-transform group-open:rotate-45">+</span>
                                    </summary>
                                    <p className="text-white/65 text-sm leading-relaxed mt-3">{c.a}</p>
                                </details>
                            );
                        })}
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
                            href={`/${locale}/contractors/apply`}
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
                        <Image src="/dtailwash_logo_final.png" alt="Lux Auto Detail Services" width={1942} height={809} className="w-auto h-9 sm:h-10 opacity-70" />
                        <p>© {new Date().getFullYear()} Lux Auto Detail Services</p>
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
