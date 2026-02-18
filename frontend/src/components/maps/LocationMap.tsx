"use client";

import { MapPin } from "lucide-react";

export default function LocationMap() {
    return (
        <div className="relative w-full h-[60vh] bg-gray-200 overflow-hidden">
            {/* Placeholder Map Background */}
            <div
                className="absolute inset-0 opacity-50 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Miami,FL&zoom=13&size=600x600&sensor=false&key=PLACEHOLDER')] bg-cover bg-center"
                style={{ backgroundImage: "url('https://media.wired.com/photos/59269cd37034dc5f91bec0f1/master/pass/GoogleMapTA.jpg')" }} // Fallback image
            ></div>

            {/* Grid Pattern Overlay to make it look technical/premium */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            {/* Pin */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                <MapPin className="w-10 h-10 text-[var(--accent)] fill-[var(--accent)] drop-shadow-lg" />
                <div className="w-4 h-4 bg-[var(--accent)]/50 rounded-full blur-sm mt-1 animate-pulse"></div>
            </div>

            {/* Instruction Overlay */}
            <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                <span className="bg-[var(--card)]/80 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium text-[var(--text-primary)] shadow-sm border border-[var(--divider)]">
                    Drag to adjust location
                </span>
            </div>
        </div>
    );
}
