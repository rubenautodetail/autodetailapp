import { ServiceSelectionForm } from "@/components/booking";
import { fetchServices, fetchAddOns, StrapiService, StrapiAddOn } from "@/lib/api/strapi";
import { Service, AddOn } from "@/contexts";
import { Metadata } from 'next';

// Map Strapi service to BookingContext Service
function mapStrapiService(s: StrapiService): Service {
  return {
    id: s.id,
    documentId: s.documentId,
    strapiId: s.id,
    name: s.name,  // Already localized from Strapi
    description: s.description,  // Already localized from Strapi
    basePrice: s.basePrice,
    duration: s.durationMinutes,
  };
}

// Map Strapi add-on to BookingContext AddOn
function mapStrapiAddOn(a: StrapiAddOn): AddOn {
  return {
    id: a.id,
    documentId: a.documentId,
    strapiId: a.id,
    name: a.name,  // Already localized from Strapi
    description: a.description,  // Already localized from Strapi
    price: a.price,
  };
}

// Fallback mock data (used only when Strapi is completely down)
const FALLBACK_SERVICES: Service[] = [
  {
    id: "interior",
    documentId: "interior_doc_id",
    name: "Interior Detail",
    description: "Deep clean of interior surfaces, seats, carpets, and dashboard",
    basePrice: 89.99,
    duration: 120,
  },
  {
    id: "exterior",
    documentId: "exterior_doc_id",
    name: "Exterior Detail",
    description: "Complete exterior wash, wax, tire shine, and window cleaning",
    basePrice: 79.99,
    duration: 90,
  },
  {
    id: "full-detail",
    documentId: "full_detail_doc_id",
    name: "Full Detail Package",
    description: "Complete interior and exterior detailing package - best value!",
    basePrice: 149.99,
    duration: 180,
  },
];

const FALLBACK_ADDONS: AddOn[] = [
  {
    id: "premium-wax",
    documentId: "premium_wax_doc_id",
    name: "Premium Wax",
    price: 29.99,
    description: "High-grade carnauba wax for long-lasting shine",
  },
  {
    id: "tire-shine",
    documentId: "tire_shine_doc_id",
    name: "Tire Shine & Dressing",
    price: 15.99,
    description: "Professional tire dressing for a deep black shine",
  },
  {
    id: "pet-hair",
    documentId: "pet_hair_doc_id",
    name: "Pet Hair Removal",
    price: 34.99,
    description: "Deep cleaning to remove pet hair from seats and carpet",
  },
  {
    id: "headlight",
    documentId: "headlight_doc_id",
    name: "Headlight Restoration",
    price: 44.99,
    description: "Restore cloudy headlights to like-new clarity",
  },
];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = (lang === 'es' || lang === 'en') ? lang : 'en';

  return {
    title: locale === 'es' ? 'Seleccionar Servicio | Rubens Auto Detail' : 'Select Service | Rubens Auto Detail',
    description: locale === 'es' ? 'Elige el paquete de detallado perfecto para tu vehículo.' : 'Choose the perfect detailing package for your vehicle.',
  };
}

export default async function SelectServicePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = (lang === 'es' || lang === 'en') ? lang : 'en';

  let services: Service[] = [];
  let addOns: AddOn[] = [];
  let dataSource: "strapi" | "fallback" = "strapi";

  try {
    // Add logic to handle cases where Strapi might be unreachable gracefully
    // Using a timeout race could be good but simple try/catch is sufficient for now
    const [strapiServices, strapiAddOns] = await Promise.all([
      fetchServices(locale),
      fetchAddOns(locale),
    ]);

    services = strapiServices.map(mapStrapiService);
    addOns = strapiAddOns.map(mapStrapiAddOn);
  } catch (error) {
    console.error("[Booking] Error fetching services/addons:", error);
    services = FALLBACK_SERVICES;
    addOns = FALLBACK_ADDONS;
    dataSource = "fallback";
  }

  return (
    <ServiceSelectionForm
      services={services}
      addOns={addOns}
      locale={locale}
      dataSource={dataSource}
    />
  );
}
