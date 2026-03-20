import { ServiceSelectionForm } from "@/components/booking";
import { fetchServices, fetchAddOns, CatalogService, CatalogAddOn } from "@/lib/api/catalog";
import { Service, AddOn } from "@/contexts";
import { Metadata } from 'next';

// Map catalog service to BookingContext Service
function mapCatalogService(s: CatalogService): Service {
  return {
    id: s.id,
    documentId: s.documentId,
    catalogId: s.id,
    name: s.name,  // Already localized from catalog
    description: s.description,  // Already localized from catalog
    basePrice: s.basePrice,
    duration: s.durationMinutes,
  };
}

// Map catalog add-on to BookingContext AddOn
function mapCatalogAddOn(a: CatalogAddOn): AddOn {
  return {
    id: a.id,
    documentId: a.documentId,
    catalogId: a.id,
    name: a.name,  // Already localized from catalog
    description: a.description,  // Already localized from catalog
    price: a.price,
  };
}

// Fallback mock data (used only when catalog is completely down)
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
    title: locale === 'es' ? 'Seleccionar Servicio | DetailWash' : 'Select Service | DetailWash',
    description: locale === 'es' ? 'Elige el paquete de detallado perfecto para tu vehículo.' : 'Choose the perfect detailing package for your vehicle.',
  };
}

export default async function SelectServicePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = (lang === 'es' || lang === 'en') ? lang : 'en';

  let services: Service[] = [];
  let addOns: AddOn[] = [];
  let dataSource: "catalog" | "fallback" = "catalog";

  try {
    // Add logic to handle cases where catalog might be unreachable gracefully
    // Using a timeout race could be good but simple try/catch is sufficient for now
    const [catalogServices, catalogAddOns] = await Promise.all([
      fetchServices(locale),
      fetchAddOns(locale),
    ]);

    services = catalogServices.map(mapCatalogService);
    addOns = catalogAddOns.map(mapCatalogAddOn);
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
