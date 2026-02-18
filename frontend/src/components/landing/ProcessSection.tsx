interface ProcessSectionProps {
    dict: any;
}

export default function ProcessSection({ dict }: ProcessSectionProps) {
    const steps = [
        {
            step: '01',
            title: dict.home.howItWorks.step1.title,
            desc: dict.home.howItWorks.step1.desc
        },
        {
            step: '02',
            title: dict.home.howItWorks.step2.title,
            desc: dict.home.howItWorks.step2.desc
        },
        {
            step: '03',
            title: dict.home.howItWorks.step3.title,
            desc: dict.home.howItWorks.step3.desc
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-bg-primary border-t border-white/5">
            <div className="absolute inset-0 bg-white/2 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-20">
                    <span className="text-accent-gold text-sm font-bold tracking-widest uppercase mb-2 block animate-fade-in">
                        Simple Process
                    </span>
                    <h2 className="text-3xl md:text-5xl font-display text-white animate-fade-in-up">
                        {dict.home.howItWorks.title}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative max-w-6xl mx-auto">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />

                    {steps.map((item, idx) => (
                        <div key={idx} className="relative z-10 text-center group">
                            <div className="w-24 h-24 mx-auto glass rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-glow transition-all duration-500 relative overflow-hidden">
                                <div className="absolute inset-0 bg-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <span className="text-3xl font-black text-accent-gold font-display">{item.step}</span>
                            </div>
                            <h3 className="text-xl font-display text-white mb-4 group-hover:text-accent-gold transition-colors block">
                                {item.title}
                            </h3>
                            <p className="text-text-secondary leading-relaxed px-4 font-light">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
