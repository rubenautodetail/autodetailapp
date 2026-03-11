import Link from 'next/link';
import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
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
                      body: 'Al acceder y utilizar la Plataforma Rubens Auto Detail, usted acepta y se compromete a cumplir con los términos y disposiciones de este acuerdo. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.',
                  },
                  {
                      heading: '2. Descripción del Servicio',
                      body: 'Rubens Auto Detail es una plataforma de mercado que conecta a propietarios de vehículos ("Clientes") con profesionales independientes de detallado de automóviles ("Contratistas"). Facilitamos las reservas y los pagos, pero no somos directamente responsables de los servicios prestados por los Contratistas. Los Contratistas son trabajadores independientes, no empleados de la plataforma.',
                  },
                  {
                      heading: '3. Elegibilidad y Cuentas de Usuario',
                      body: 'Debe tener al menos 18 años para utilizar este servicio. Es responsable de mantener la confidencialidad de las credenciales de su cuenta y de todas las actividades que ocurran bajo su cuenta. Notifíquenos inmediatamente de cualquier uso no autorizado.',
                  },
                  {
                      heading: '4. Obligaciones del Cliente',
                      body: 'Los Clientes se comprometen a: (a) proporcionar información precisa sobre el vehículo y la ubicación; (b) garantizar un entorno de trabajo seguro y accesible para el Contratista; (c) estar disponibles o autorizar a alguien para supervisar el servicio; (d) no intimidar, acosar ni maltratar al personal del servicio.',
                  },
                  {
                      heading: '5. Obligaciones del Contratista',
                      body: 'Los Contratistas se comprometen a: (a) mantener licencias, seguros y certificaciones vigentes requeridos por la ley; (b) prestar servicios con estándares profesionales; (c) llegar puntualmente a las citas programadas; (d) tratar a los vehículos y propiedades de los clientes con el máximo cuidado; (e) completar el proceso de aprobación de la plataforma antes de aceptar trabajos.',
                  },
                  {
                      heading: '6. Pagos, Tarifas y Devoluciones',
                      body: 'Los pagos se procesan de forma segura a través de Stripe. La plataforma cobra una comisión del 15% sobre cada transacción. Los reembolsos por cancelaciones realizadas con más de 24 horas de anticipación son elegibles para reembolso completo. Las cancelaciones con menos de 24 horas de anticipación pueden estar sujetas a un cargo del 50% del costo del servicio. Los cargos fraudulentos deben reportarse dentro de los 7 días.',
                  },
                  {
                      heading: '7. Política de Cancelación',
                      body: 'Puede cancelar o reprogramar una reserva sin costo hasta 24 horas antes de la cita. Las cancelaciones tardías o ausencias pueden incurrir en una tarifa de cancelación. Los Contratistas también pueden cancelar en circunstancias excepcionales; en tal caso, recibirá un reembolso completo y asistencia para reprogramar.',
                  },
                  {
                      heading: '8. Limitación de Responsabilidad',
                      body: 'La Plataforma Rubens Auto Detail no se hace responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos que resulten del uso de nuestro servicio. Nuestra responsabilidad total no excederá el monto pagado por el servicio específico en cuestión.',
                  },
                  {
                      heading: '9. Resolución de Disputas',
                      body: 'En caso de disputa entre un Cliente y un Contratista, la plataforma actuará como mediador de buena fe pero sin obligación de resolver la disputa. Las disputas no resueltas se someterán a arbitraje vinculante conforme a las reglas de la Asociación Americana de Arbitraje.',
                  },
                  {
                      heading: '10. Ley Aplicable',
                      body: 'Estos términos se rigen por las leyes del Estado de Florida, EE. UU., sin tener en cuenta sus disposiciones sobre conflicto de leyes. Cualquier acción legal deberá presentarse en los tribunales competentes del Condado de Miami-Dade.',
                  },
                  {
                      heading: '11. Modificaciones a los Términos',
                      body: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos los cambios sustanciales por correo electrónico o mediante un aviso destacado en la plataforma. El uso continuado del servicio después de dichos cambios constituye su aceptación de los nuevos términos.',
                  },
              ]
            : [
                  {
                      heading: '1. Acceptance of Terms',
                      body: 'By accessing and using the Rubens Auto Detail Platform, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to any part of these terms, you may not access the service.',
                  },
                  {
                      heading: '2. Service Description',
                      body: 'Rubens Auto Detail is a marketplace platform connecting vehicle owners ("Customers") with independent auto detailing professionals ("Contractors"). We facilitate bookings and payments but are not directly responsible for the services provided by Contractors. Contractors are independent workers, not employees of the platform.',
                  },
                  {
                      heading: '3. User Accounts & Eligibility',
                      body: 'You must be at least 18 years old to use this service. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.',
                  },
                  {
                      heading: '4. Customer Obligations',
                      body: 'Customers agree to: (a) provide accurate vehicle and location information; (b) ensure a safe and accessible working environment for the Contractor; (c) be present or authorize someone to oversee the service; (d) not intimidate, harass, or mistreat service personnel.',
                  },
                  {
                      heading: '5. Contractor Obligations',
                      body: 'Contractors agree to: (a) maintain valid licenses, insurance, and certifications required by law; (b) deliver services to professional standards; (c) arrive punctually to scheduled appointments; (d) treat customer vehicles and property with utmost care; (e) complete the platform approval process before accepting jobs.',
                  },
                  {
                      heading: '6. Payments, Fees & Refunds',
                      body: 'Payments are processed securely via Stripe. The platform charges a 15% commission on each transaction. Cancellations made more than 24 hours in advance are eligible for a full refund. Cancellations within 24 hours may be subject to a 50% cancellation fee. Fraudulent charges must be reported within 7 days.',
                  },
                  {
                      heading: '7. Cancellation Policy',
                      body: 'You may cancel or reschedule a booking at no cost up to 24 hours before your appointment. Late cancellations or no-shows may incur a cancellation fee. Contractors may also cancel under exceptional circumstances; in that case, you will receive a full refund and assistance rescheduling.',
                  },
                  {
                      heading: '8. Limitation of Liability',
                      body: 'Rubens Auto Detail Platform is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of our service. Our total liability shall not exceed the amount paid for the specific service in question.',
                  },
                  {
                      heading: '9. Dispute Resolution',
                      body: 'In the event of a dispute between a Customer and a Contractor, the platform will act as a good-faith mediator but without obligation to resolve the dispute. Unresolved disputes shall be submitted to binding arbitration under the rules of the American Arbitration Association.',
                  },
                  {
                      heading: '10. Governing Law',
                      body: 'These terms are governed by the laws of the State of Florida, USA, without regard to its conflict of law provisions. Any legal action must be filed in the appropriate courts of Miami-Dade County.',
                  },
                  {
                      heading: '11. Changes to Terms',
                      body: 'We reserve the right to modify these terms at any time. We will notify you of material changes via email or a prominent notice on the platform. Continued use of the service after such changes constitutes your acceptance of the new terms.',
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
                        className="text-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                        ← {es ? 'Volver al inicio' : 'Back to home'}
                    </Link>
                    <Link
                        href={`/${lang}/privacy`}
                        className="text-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                        {es ? 'Política de Privacidad' : 'Privacy Policy'} →
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-6 py-16 max-w-3xl">
                {/* Title */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-3">{t.title}</h1>
                    <p className="text-white/40 text-sm">
                        {t.updated}: {new Date().toLocaleDateString(es ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-10">
                    {t.sections.map((section, i) => (
                        <div key={i} className="border-b border-white/5 pb-10 last:border-0">
                            <h2 className="text-lg font-semibold text-[#D0B078] mb-3">{section.heading}</h2>
                            <p className="text-white/60 leading-relaxed">{section.body}</p>
                        </div>
                    ))}
                </div>

                {/* Contact */}
                <div className="mt-12 p-6 rounded-xl border border-white/10 bg-white/5">
                    <p className="text-white/50 text-sm">
                        {es
                            ? '¿Preguntas sobre estos términos? Contáctenos en '
                            : 'Questions about these terms? Contact us at '}
                        <a
                            href="mailto:support@rubensautodetail.com"
                            className="text-[#D0B078] hover:underline"
                        >
                            support@rubensautodetail.com
                        </a>
                    </p>
                </div>

                {/* OAC Digital Innovations credit */}
                <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-white/20 text-xs">
                        {es ? 'Diseñado por' : 'Designed by'}{' '}
                        <span className="text-white/35 font-medium">OAC Digital Innovations</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
