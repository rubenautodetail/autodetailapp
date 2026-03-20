import { PaymentForm } from "@/components/booking";
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = (lang === 'es' || lang === 'en') ? lang : 'en';

  return {
    title: locale === 'es' ? 'Finalizar Reserva | DetailWash' : 'Checkout | DetailWash',
    description: locale === 'es' ? 'Completa tu reserva y realiza el pago seguro.' : 'Complete your booking and secure payment.',
  };
}

export default async function PaymentPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = (lang === 'es' || lang === 'en') ? lang : 'en';

  return <PaymentForm locale={locale} />;
}
