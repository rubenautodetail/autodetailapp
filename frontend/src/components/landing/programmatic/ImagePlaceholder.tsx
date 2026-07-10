import Image from 'next/image';

/**
 * Premium image slot for programmatic landing pages.
 *
 * - If `src` is provided → renders an optimized next/image.
 * - If not → renders an on-brand placeholder (navy + gold, glass) that shows
 *   the intended shot and embeds the generation prompt in `data-ai-prompt`
 *   so an image-gen pass (or a human) can fill it later. Prompts are catalogued
 *   in `marketing/seo-research/IMAGE-PROMPTS.md`.
 */
export default function ImagePlaceholder({
    src,
    alt,
    prompt,
    aspect = 'aspect-[4/3]',
    priority = false,
    className = '',
}: {
    src?: string | null;
    alt: string;
    /** image-generation prompt for this slot */
    prompt: string;
    /** tailwind aspect ratio class */
    aspect?: string;
    priority?: boolean;
    className?: string;
}) {
    if (src) {
        return (
            <div className={`relative ${aspect} w-full overflow-hidden rounded-2xl ${className}`}>
                <Image src={src} alt={alt} fill priority={priority} className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
        );
    }

    return (
        <div
            data-ai-prompt={prompt}
            role="img"
            aria-label={alt}
            className={`relative ${aspect} w-full overflow-hidden rounded-2xl border border-dashed border-[#D0B078]/30 bg-gradient-to-br from-[#1A2142] to-[#131835] ${className}`}
        >
            {/* subtle grain / glow atmosphere */}
            <div className="pointer-events-none absolute inset-0 opacity-60 [background:radial-gradient(120%_120%_at_20%_0%,rgba(208,176,120,0.12),transparent_55%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D0B078]/40 bg-[#D0B078]/10 text-lg text-[#D0B078]">
                    ✦
                </div>
                <p className="text-sm font-medium text-white/80">{alt}</p>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-widest text-white/40">
                    Image slot · prompt ready
                </span>
            </div>
        </div>
    );
}
