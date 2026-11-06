import Link from 'next/link';
import LanguageSwitch from '@/components/landing/LanguageSwitch';
import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const isEs = lang === 'es';

    return {
        title: isEs ? 'Términos y Condiciones' : 'Terms and Conditions',
        description: isEs
            ? 'Términos y condiciones de uso de Lux Auto Detail Services en Miami-Dade.'
            : 'Terms and conditions for using Lux Auto Detail Services in Miami-Dade.',
        alternates: {
            canonical: `/${lang}/terms`,
            languages: { en: '/en/terms', es: '/es/terms' },
        },
    };
}
export default async function TermsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const es = lang === 'es';

    const t = {
        title: es ? 'Términos de Servicio' : 'Terms of Service',
        updated: es ? 'Última actualización' : 'Last Updated',
        sections: es
            ? [
                  {
                      heading: '1. Aceptación de los Términos',
                      body: 'Al acceder y utilizar el sitio dtailwash.com y reservar servicios con Lux Auto Detail Services ("Lux", "nosotros"), usted acepta y se compromete a cumplir con estos términos. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar el servicio.',
                  },
                  {
                      heading: '2. Descripción del Servicio',
                      body: 'Lux Auto Detail Services ofrece servicios de detallado de automóviles a domicilio en Miami-Dade. Usted reserva y paga a través de dtailwash.com y nuestro equipo realiza el servicio. Cada servicio se presta conforme a estos términos y a la descripción del servicio que usted reservó.',
                  },
                  {
                      heading: '3. Elegibilidad y Cuentas de Usuario',
                      body: 'Debe tener al menos 18 años para utilizar este servicio. Es responsable de mantener la confidencialidad de las credenciales de su cuenta y de todas las actividades que ocurran bajo su cuenta. Notifíquenos inmediatamente de cualquier uso no autorizado.',
                  },
                  {
                      heading: '4. Obligaciones del Cliente',
                      body: 'Los Clientes se comprometen a: (a) proporcionar información precisa sobre el vehículo y la ubicación; (b) garantizar un entorno de trabajo seguro y accesible para nuestro equipo; (c) estar disponibles o autorizar a alguien para supervisar el servicio; (d) no intimidar, acosar ni maltratar al personal del servicio.',
                  },
                  {
                      heading: '5. Política de Cancelación',
                      body: 'Puede cancelar una reserva sin costo hasta 3 horas antes de la cita. Las cancelaciones con menos de 3 horas de anticipación incurrirán un cargo del 25% del costo del servicio. Puede reprogramar sin costo hasta 1 hora antes de la cita. Lux también puede cancelar o reprogramar en circunstancias excepcionales, por ejemplo por mal clima o razones de seguridad; en tal caso, recibirá un reembolso completo y asistencia para reprogramar.',
                  },
                  {
                      heading: '6. Limitación de Responsabilidad',
                      body: 'Lux Auto Detail Services no se hace responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos que resulten del uso de nuestro servicio. Nuestra responsabilidad total no excederá el monto pagado por el servicio específico en cuestión.',
                  },
                  {
                      heading: '7. Resolución de Disputas',
                      body: 'Si tiene algún problema con un servicio, escríbanos a support@dtailwash.com y trabajaremos de buena fe para resolverlo. Las disputas no resueltas se someterán a arbitraje vinculante conforme a las reglas de la Asociación Americana de Arbitraje.',
                  },
                  {
                      heading: '8. Ley Aplicable',
                      body: 'Estos términos se rigen por las leyes del Estado de Florida, EE. UU., sin tener en cuenta sus disposiciones sobre conflicto de leyes. Cualquier acción legal deberá presentarse en los tribunales competentes del Condado de Miami-Dade.',
                  },
                  {
                      heading: '9. Modificaciones a los Términos',
                      body: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos los cambios sustanciales por correo electrónico o mediante un aviso destacado en el sitio. El uso continuado del servicio después de dichos cambios constituye su aceptación de los nuevos términos.',
                  },
              ]
            : [
                  {
                      heading: '1. Acceptance of Terms',
                      body: 'By accessing dtailwash.com and booking services with Lux Auto Detail Services ("Lux", "we", "us"), you accept and agree to be bound by these terms. If you do not agree to any part of these terms, you may not use the service.',
                  },
                  {
                      heading: '2. Service Description',
                      body: 'Lux Auto Detail Services provides mobile auto detailing services at your location in Miami-Dade. You book and pay through dtailwash.com, and our team performs the service. Each service is provided in accordance with these terms and the service description you booked.',
                  },
                  {
                      heading: '3. User Accounts & Eligibility',
                      body: 'You must be at least 18 years old to use this service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.',
                  },
                  {
                      heading: '4. Customer Obligations',
                      body: 'Customers agree to: (a) provide accurate vehicle and location information; (b) ensure a safe and accessible working environment for our team; (c) be present or authorize someone to oversee the service; (d) not intimidate, harass, or mistreat service personnel.',
                  },
                  {
                      heading: '5. Cancellation Policy',
                      body: 'You may cancel a booking at no cost up to 3 hours before your appointment. Cancellations made less than 3 hours before the appointment will incur a 25% cancellation fee. Rescheduling is available up to 1 hour before the appointment at no charge. Lux may also cancel or reschedule under exceptional circumstances, such as bad weather or safety reasons; in that case, you will receive a full refund and assistance rescheduling.',
                  },
                  {
                      heading: '6. Limitation of Liability',
                      body: 'Lux Auto Detail Services is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of our service. Our total liability shall not exceed the amount paid for the specific service in question.',
                  },
                  {
                      heading: '7. Dispute Resolution',
                      body: 'If you have a problem with a service, write to us at support@dtailwash.com and we will work in good faith to resolve it. Unresolved disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association.',
                  },
                  {
                      heading: '8. Governing Law',
                      body: 'These terms are governed by the laws of the State of Florida, USA, without regard to its conflict of law provisions. Any legal action must be filed in the appropriate courts of Miami-Dade County.',
                  },
                  {
                      heading: '9. Changes to Terms',
                      body: 'We reserve the right to modify these terms at any time. We will notify you of material changes via email or a prominent notice on the site. Continued use of the service after such changes constitutes your acceptance of the new terms.',
                  },
              ],
    };

    return (
        <div className="min-h-screen bg-[#131835] text-white">
            {/* Header bar */}
            <div className="border-b border-white/5 px-6 py-4">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link
                        href={`/${lang}`}
                        className="text-sm text-white/65 hover:text-white/90 transition-colors"
                    >
                        ← {es ? 'Volver al inicio' : 'Back to home'}
                    </Link>
                    <div className="flex items-center gap-4">
                        <LanguageSwitch locale={es ? 'es' : 'en'} href={`/${es ? 'en' : 'es'}/terms`} />
                        <Link
                            href={`/${lang}/privacy`}
                            className="text-sm text-white/65 hover:text-white/90 transition-colors"
                        >
                            {es ? 'Política de Privacidad' : 'Privacy Policy'} →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 max-w-3xl">
                {/* Title */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3">{t.title}</h1>
                    <p className="text-white/60 text-sm">
                        {t.updated}: {es ? '6 de noviembre de 2026' : 'November 6, 2026'}
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-10">
                    {t.sections.map((section, i) => (
                        <div key={i} className="border-b border-white/5 pb-10 last:border-0">
                            <h2 className="text-lg font-semibold text-[#D0B078] mb-3">{section.heading}</h2>
                            <p className="text-white/75 leading-relaxed">{section.body}</p>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-white/65 text-sm">
                        {es
                            ? '¿Preguntas sobre estos términos? Contáctenos en '
                            : 'Questions about these terms? Contact us at '}
                        <a
                            href="mailto:support@dtailwash.com"
                            className="text-[#D0B078] hover:underline"
                        >
                            support@dtailwash.com
                        </a>
                    </p>
                </div>

                {/* Lux Auto Detail Services credit */}
                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/50 text-xs">
                        {es ? '© 2026' : '© 2026'}{' '}
                        <span className="text-white/65 font-medium">Lux Auto Detail Services</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
