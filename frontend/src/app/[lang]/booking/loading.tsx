/**
 * Loading state for booking flow
 * Simple spinner — loading.tsx cannot access params/locale for bilingual text.
 */

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#131835] flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#D0B078]"></div>
        </div>
    );
}
