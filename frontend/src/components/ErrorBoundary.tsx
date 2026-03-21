"use client";

import React from "react";
import Link from "next/link";

interface Props {
    children: React.ReactNode;
    lang?: string;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info);
    }

    render() {
        const { lang = "en" } = this.props;
        const isEs = lang === "es";

        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
                    <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
                        <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            {isEs ? "Algo salió mal" : "Something went wrong"}
                        </h2>
                        <p className="text-text-secondary text-sm mb-7 leading-relaxed">
                            {isEs
                                ? "Ocurrió un error inesperado. Por favor, regresa al inicio."
                                : "An unexpected error occurred. Please go back to the dashboard."}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => this.setState({ hasError: false })}
                                className="w-full py-3 btn-primary rounded-xl font-bold text-sm"
                            >
                                {isEs ? "Intentar de nuevo" : "Try again"}
                            </button>
                            <Link
                                href={`/${lang}`}
                                className="w-full py-3 glass-card hover:bg-white/5 text-text-secondary hover:text-white rounded-xl font-semibold text-sm transition-all text-center"
                            >
                                {isEs ? "Volver al inicio" : "Go home"}
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
