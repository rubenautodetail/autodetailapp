import ResumePaymentForm from "@/components/booking/ResumePaymentForm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang === "es" ? "es" : "en";
  return {
    title: locale === "es" ? "Completar Pago | DetailWash" : "Complete Payment | DetailWash",
    description: locale === "es" ? "Completa el pago de tu reserva pendiente." : "Complete payment for your pending booking.",
  };
}

export default async function ResumePaymentPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const locale = (lang === "es" || lang === "en") ? lang : "en";

  return <ResumePaymentForm bookingId={id} locale={locale} />;
}
