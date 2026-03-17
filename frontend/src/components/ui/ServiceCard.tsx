"use client";

import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
    title: string;
    price: string;
    description: string;
    onClick?: () => void;
}

export default function ServiceCard({ title, price, description, onClick }: ServiceCardProps) {
    return (
        <button
            onClick={onClick}
            className="group relative flex flex-col justify-between w-[280px] h-[320px] p-6 bg-[#1A2142] rounded-3xl shadow-lg border border-[#2C355E] hover:scale-[1.02] transition-all duration-300 text-left shrink-0 snap-center"
        >
            <div>
                <div className="w-12 h-12 rounded-2xl bg-[#D0B078]/10 flex items-center justify-center mb-6 text-[#D0B078]">
                    ✨
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D0B078] transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-[#A5B0D1] leading-relaxed line-clamp-3">
                    {description}
                </p>
            </div>

            <div className="flex items-center justify-between mt-4">
                <span className="text-lg font-semibold text-white">
                    {price}<span className="text-xs font-normal text-[#A5B0D1]">+</span>
                </span>
                <div className="w-10 h-10 rounded-full bg-[#131835] flex items-center justify-center group-hover:bg-[#D0B078] group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                </div>
            </div>
        </button>
    );
}
