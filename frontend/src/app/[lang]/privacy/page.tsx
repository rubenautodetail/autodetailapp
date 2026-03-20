import Link from 'next/link';
import { i18n } from '@/i18n-config';

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const es = lang === 'es';

    const t = {
        title: es ? 'Política de Privacidad' : 'Privacy Policy',
        updated: es ? 'Última actualización' : 'Last Updated',
        sections: es
            ? [
                  {
                      heading: '1. Información que Recopilamos',
                      body: 'Recopilamos: (a) información que usted proporciona directamente, como nombre, correo electrónico, número de teléfono y detalles del vehículo al registrarse o hacer una reserva; (b) información de pago procesada por Stripe (no almacenamos números de tarjeta completos); (c) datos de uso de la plataforma, incluyendo historial de reservas y preferencias; (d) documentos de verificación de Contratistas como licencias y seguros.',
                  },
                  {
                      heading: '2. Cómo Usamos su Información',
                      body: 'Utilizamos su información para: facilitar reservas de servicios; procesar pagos de forma segura; enviar confirmaciones, recordatorios y actualizaciones de estado; mejorar la funcionalidad de la plataforma; cumplir con obligaciones legales y prevenir fraudes; comunicarnos con usted sobre cambios en el servicio o en esta política.',
                  },
                  {
                      heading: '3. Compartir Información',
                      body: 'Compartimos información necesaria con Contratistas asignados para cumplir con las solicitudes de servicio (nombre, dirección de servicio, detalles del vehículo). Trabajamos con Stripe para el procesamiento de pagos y Resend para comunicaciones por correo electrónico. No vendemos sus datos personales a terceros. Podemos divulgar información si así lo exige la ley.',
                  },
                  {
                      heading: '4. Retención de Datos',
                      body: 'Conservamos los datos de su cuenta mientras su cuenta esté activa. Los registros de transacciones se mantienen durante 7 años por razones fiscales y legales. Puede solicitar la eliminación de su cuenta y datos personales en cualquier momento, sujeto a las obligaciones legales de retención.',
                  },
                  {
                      heading: '5. Sus Derechos',
                      body: 'Tiene derecho a: acceder a los datos personales que tenemos sobre usted; corregir información inexacta; solicitar la eliminación de sus datos; oponerse o limitar ciertos usos de sus datos; recibir sus datos en un formato portátil. Para ejercer estos derechos, contáctenos en support@dtailwash.com.',
                  },
                  {
                      heading: '6. Cookies y Seguimiento',
                      body: 'Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticación de sesión, preferencias de idioma). No utilizamos cookies de seguimiento de terceros con fines publicitarios. Puede configurar su navegador para rechazar cookies, aunque algunas funciones podrían verse afectadas.',
                  },
                  {
                      heading: '7. Seguridad de los Datos',
                      body: 'Implementamos medidas técnicas y organizativas adecuadas para proteger sus datos personales, incluyendo cifrado en tránsito (TLS) y en reposo, control de acceso basado en roles y auditorías de seguridad periódicas. Sin embargo, ningún sistema es completamente seguro; utilice contraseñas fuertes y no las comparta.',
                  },
                  {
                      heading: '8. Privacidad de Menores',
                      body: 'Este servicio no está dirigido a menores de 18 años. No recopilamos a sabiendas información personal de menores. Si cree que hemos recopilado dicha información, contáctenos para eliminarla de inmediato.',
                  },
                  {
                      heading: '9. Cambios a Esta Política',
                      body: 'Podemos actualizar esta política de privacidad periódicamente. Le notificaremos los cambios sustanciales por correo electrónico o mediante un aviso en la plataforma. La fecha de la última actualización siempre aparecerá al inicio de este documento.',
                  },
                  {
                      heading: '10. Contáctenos',
                      body: 'Si tiene preguntas sobre esta política o sobre cómo manejamos sus datos, póngase en contacto con nosotros en support@dtailwash.com. Responderemos dentro de los 30 días hábiles.',
                  },
              ]
            : [
                  {
                      heading: '1. Information We Collect',
                      body: 'We collect: (a) information you provide directly, such as name, email, phone number, and vehicle details when registering or booking; (b) payment information processed by Stripe (we do not store full card numbers); (c) platform usage data, including booking history and preferences; (d) Contractor verification documents such as licenses and insurance.',
                  },
                  {
                      heading: '2. How We Use Your Information',
                      body: 'We use your information to: facilitate service bookings; process payments securely; send confirmations, reminders, and status updates; improve platform functionality; fulfill legal obligations and prevent fraud; communicate with you about service changes or updates to this policy.',
                  },
                  {
                      heading: '3. Information Sharing',
                      body: 'We share necessary information with assigned Contractors to fulfill service requests (name, service address, vehicle details). We work with Stripe for payment processing and Resend for email communications. We do not sell your personal data to third parties. We may disclose information when required by law.',
                  },
                  {
                      heading: '4. Data Retention',
                      body: 'We retain account data for as long as your account is active. Transaction records are kept for 7 years for tax and legal reasons. You may request deletion of your account and personal data at any time, subject to legal retention obligations.',
                  },
                  {
                      heading: '5. Your Rights',
                      body: 'You have the right to: access the personal data we hold about you; correct inaccurate information; request deletion of your data; object to or restrict certain uses of your data; receive your data in a portable format. To exercise these rights, contact us at support@dtailwash.com.',
                  },
                  {
                      heading: '6. Cookies & Tracking',
                      body: 'We use essential cookies for platform operation (session authentication, language preferences). We do not use third-party tracking cookies for advertising purposes. You may configure your browser to reject cookies, though some features may be affected.',
                  },
                  {
                      heading: '7. Data Security',
                      body: 'We implement appropriate technical and organizational measures to protect your personal data, including encryption in transit (TLS) and at rest, role-based access controls, and regular security audits. However, no system is completely secure — use strong passwords and do not share them.',
                  },
                  {
                      heading: "8. Children's Privacy",
                      body: 'This service is not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have collected such information, contact us to have it promptly deleted.',
                  },
                  {
                      heading: '9. Changes to This Policy',
                      body: 'We may update this privacy policy periodically. We will notify you of material changes via email or a prominent notice on the platform. The date of the most recent update will always appear at the top of this document.',
                  },
                  {
                      heading: '10. Contact Us',
                      body: 'If you have questions about this policy or how we handle your data, please contact us at support@dtailwash.com. We will respond within 30 business days.',
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
                        href={`/${lang}/terms`}
                        className="text-sm text-white/40 hover:text-white/70 transition-colors"
                    >
                        {es ? 'Términos de Servicio' : 'Terms of Service'} →
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
                            ? '¿Preguntas sobre su privacidad? Contáctenos en '
                            : 'Questions about your privacy? Contact us at '}
                        <a
                            href="mailto:support@dtailwash.com"
                            className="text-[#D0B078] hover:underline"
                        >
                            support@dtailwash.com
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
