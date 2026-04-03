import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#131835] flex items-center justify-center px-4">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold text-[#D0B078]">404</h1>
                <p className="text-lg text-white">Page not found</p>
                <p className="text-sm text-[#A5B0D1]">The page you are looking for does not exist or has been moved.</p>
                <Link href="/en" className="inline-block mt-4 px-6 py-3 bg-[#D0B078] text-[#131835] font-bold rounded-xl hover:opacity-90 transition-opacity">
                    Go Home
                </Link>
            </div>
        </div>
    );
}
