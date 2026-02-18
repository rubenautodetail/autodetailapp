'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800">Something went wrong!</h2>
                    <p className="text-gray-600 mb-6">We apologize for the inconvenience.</p>
                    <button
                        onClick={() => reset()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
