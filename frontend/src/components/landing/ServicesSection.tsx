interface ServicesSectionProps {
    dict: any;
}

export default function ServicesSection({ dict }: ServicesSectionProps) {
    const services = [
        {
            id: 'interior',
            title: dict.home.services.interior.title,
            description: dict.home.services.interior.desc,
            price: dict.home.services.interior.price,
        },
        {
            id: 'exterior',
            title: dict.home.services.exterior.title,
            description: dict.home.services.exterior.desc,
            price: dict.home.services.exterior.price,
        },
        {
            id: 'full',
            title: dict.home.services.full.title,
            description: dict.home.services.full.desc,
            price: dict.home.services.full.price,
            featured: true,
        },
    ];

    return (
        <section className="py-32 bg-bg-primary relative border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20">
                    <h2 className="text-4xl md:text-6xl font-display text-white max-w-lg leading-tight">
                        Curated <span className="text-text-secondary">Signature</span> Treatments.
                    </h2>
                    <p className="text-text-secondary max-w-sm mt-8 md:mt-0 font-light">
                        {dict.home.services.subtitle || "Experience the pinnacle of automotive care with our exclusive mobile detailing packages."}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 gap-x-8">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            className={`group flex flex-col border-t border-white/10 pt-8 transition-colors hover:border-accent-gold/50 ${service.featured ? 'md:-mt-12' : ''}`}
                        >
                            <span className="text-xs text-accent-gold tracking-widest mb-4">0{index + 1}</span>
                            <h3 className="text-3xl font-display text-white mb-4 group-hover:text-accent-gold transition-colors">
                                {service.title}
                            </h3>
                            <p className="text-text-muted font-light leading-relaxed mb-8 flex-1">
                                {service.description}
                            </p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-white font-medium">{service.price}</span>
                                <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all">
                                    ↗
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
