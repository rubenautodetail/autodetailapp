import Image from 'next/image';
import type { VehicleBrand } from '@/lib/hygraph';

interface BrandCarouselProps {
    brands: VehicleBrand[];
    locale?: 'en' | 'es';
}

export const FALLBACK_VEHICLE_BRANDS: VehicleBrand[] = [
    { name: 'Toyota', slug: 'toyota', logoUrl: '/images/brands/toyota.svg', sortOrder: 10 },
    { name: 'Honda', slug: 'honda', logoUrl: '/images/brands/honda.svg', sortOrder: 20 },
    { name: 'Ford', slug: 'ford', logoUrl: '/images/brands/ford.svg', sortOrder: 30 },
    { name: 'BMW', slug: 'bmw', logoUrl: '/images/brands/bmw.svg', sortOrder: 40 },
    { name: 'Audi', slug: 'audi', logoUrl: '/images/brands/audi.svg', sortOrder: 50 },
    { name: 'Tesla', slug: 'tesla', logoUrl: '/images/brands/tesla.svg', sortOrder: 60 },
];

export default function BrandCarousel({ brands, locale = 'en' }: BrandCarouselProps) {
    if (brands.length === 0) return null;

    const headingId = `vehicle-brands-heading-${locale}`;

    return (
        <section
            className="overflow-hidden border-b border-white/5 bg-white/[0.01] py-10 sm:py-12"
            aria-labelledby={headingId}
        >
            <div className="mb-7 space-y-2 px-6 text-center">
                <p id={headingId} className="text-xs font-medium uppercase tracking-widest text-[#D0B078]">
                    {locale === 'es' ? 'Marcas que atendemos' : 'Vehicles we service'}
                </p>
                <p className="text-sm text-white/50">
                    {locale === 'es'
                        ? 'Desde autos cotidianos hasta vehículos premium'
                        : 'From everyday drivers to premium vehicles'}
                </p>
            </div>

            <div className="[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="flex w-max animate-brand-marquee hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
                    {[0, 1].map((groupIndex) => (
                        <ul
                            key={groupIndex}
                            className={`flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-8 motion-reduce:pr-0 ${groupIndex === 1 ? 'motion-reduce:hidden' : ''}`}
                            aria-hidden={groupIndex === 1 ? true : undefined}
                        >
                            {brands.map((brand) => (
                                <li key={`${groupIndex}-${brand.slug}`} className="flex h-14 w-28 shrink-0 items-center justify-center sm:w-32">
                                    <Image
                                        src={brand.logoUrl}
                                        alt={groupIndex === 0 ? `${brand.name} logo` : ''}
                                        width={144}
                                        height={56}
                                        unoptimized
                                        className="max-h-11 w-auto max-w-full object-contain opacity-65 grayscale brightness-0 invert transition-opacity duration-300 hover:opacity-100"
                                    />
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>
        </section>
    );
}
