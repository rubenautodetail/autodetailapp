"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BottomSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export default function BottomSheetModal({
    isOpen,
    onClose,
    title,
    children,
    footer,
}: BottomSheetModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#1A2142] rounded-t-3xl sm:rounded-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[90vh] flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                {/* Drag Handle (Mobile only visually) */}
                <div className="w-full h-6 flex items-center justify-center sm:hidden">
                    <div className="w-12 h-1.5 rounded-full bg-[#2C355E]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pb-4 border-b border-[#2C355E]">
                    <h2 className="text-xl font-bold text-white">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[#131835] transition-colors"
                    >
                        <X className="w-5 h-5 text-[#A5B0D1]" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {children}
                </div>

                {/* Sticky Footer */}
                {footer && (
                    <div className="p-6 border-t border-[#2C355E] bg-[#1A2142]">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
