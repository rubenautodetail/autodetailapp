'use client';

import ZipChecker from '../ZipChecker/ZipChecker';

interface HeroSectionProps {
    dict: {
        common: { tagline?: string };
        home: { hero: { subtitle?: string } };
        zipChecker: {
            placeholder: string;
            button: string;
            checking: string;
            available: string;
            unavailable: string;
            error: string;
            continue: string;
            waitlist: {
                title: string;
                description: string;
                emailPlaceholder: string;
                submit: string;
            };
        };
    };
    lang: string;
}

export default function HeroSection({ dict, lang }: HeroSectionProps) {
    return (
        <section className="relative min-h-screen flex flex-col items-center pt-24 pb-12 overflow-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-gold-300/5 rounded-full blur-[150px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="container relative z-10 mx-auto px-6 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-12 py-12">
                     {/* Badge */}
                     <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in opacity-0" style={{ animationDelay: '0.1s' }}>
                         <span className="w-1.5 h-1.5 rounded-full bg-gradient-gold animate-pulse"></span>
                         <span className="text-gold-100 text-xs font-bold tracking-[0.2em] uppercase">
                             {dict.common.tagline || 'Experience Perfection'}
                         </span>
                     </div>
 
                     {/* Headline */}
                     <h1 className="space-y-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
                         <span className="block font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] text-white">
                             Automotive
                         </span>
                         <span className="block font-display text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.1] text-gradient-gold">
                             Excellence
                         </span>
                     </h1>
 
                     {/* Process/Subhead */}
                     <p className="text-lg md:text-xl text-text-secondary max-w-2xl font-light leading-relaxed animate-fade-in-up opacity-0" style={{ animationDelay: '0.3s' }}>
                         {dict.home.hero.subtitle || 'Bespoke mobile detailing for the uncompromising enthusiast. We bring the studio to your driveway.'}
                     </p>
 
                     {/* CTA / Checker */}
                     <div className="w-full max-w-lg relative z-50 mt-12 bg-transparent">
                         <ZipChecker dict={dict.zipChecker} lang={lang} />
 
                         <p className="mt-6 text-xs text-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
                             <span className="w-8 h-[1px] bg-white/10"></span>
                             Instant Availability Check
                             <span className="w-8 h-[1px] bg-white/10"></span>
                         </p>
                     </div>
                </div>
            </div>

            {/* Scroll Indicator - Flex flow for safety */}
            <div className="relative z-10 mt-auto pb-8 animate-bounce hidden sm:block">
                <svg className="w-6 h-6 text-white/20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
}
