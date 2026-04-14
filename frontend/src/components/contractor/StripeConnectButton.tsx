"use client";

import { useState, useEffect } from 'react';
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fetchOnboardingStatus, initiateOnboarding, OnboardingStatus } from '@/lib/api/contractor';

const labels = {
    en: {
        loadingStatus: "Loading payment status...",
        paymentsConnected: "Payments Connected",
        paymentsConnectedDesc: "Your Stripe account is active and you are ready to receive payouts.",
        actionRequired: "Action Required",
        actionRequiredDesc: "Your Stripe account needs more information before you can receive payouts.",
        completeVerification: "Complete Verification",
        getPaid: "Get Paid",
        getPaidDesc: "Connect your Stripe account to receive automated payouts for completed jobs.",
        connectStripe: "Connect Stripe",
        errorLoad: "Failed to load payment status",
        errorOnboarding: "Failed to start onboarding. Please try again.",
    },
    es: {
        loadingStatus: "Cargando estado de pago...",
        paymentsConnected: "Pagos Conectados",
        paymentsConnectedDesc: "Tu cuenta de Stripe está activa y lista para recibir pagos.",
        actionRequired: "Acción Requerida",
        actionRequiredDesc: "Tu cuenta de Stripe necesita más información antes de poder recibir pagos.",
        completeVerification: "Completar Verificación",
        getPaid: "Recibir Pagos",
        getPaidDesc: "Conecta tu cuenta de Stripe para recibir pagos automáticos por trabajos completados.",
        connectStripe: "Conectar Stripe",
        errorLoad: "Error al cargar estado de pago",
        errorOnboarding: "Error al iniciar verificación. Inténtalo de nuevo.",
    },
};

interface StripeConnectButtonProps {
    locale?: "en" | "es";
}

export default function StripeConnectButton({ locale = "en" }: StripeConnectButtonProps) {
    const t = labels[locale];
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const data = await fetchOnboardingStatus();
            setStatus(data);
        } catch (err) {
            console.error('Error fetching onboarding status:', err);
            setError(t.errorLoad);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            const { url } = await initiateOnboarding();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No onboarding URL returned');
            }
        } catch (err) {
            console.error('Error initiating onboarding:', err);
            setError(t.errorOnboarding);
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 bg-[var(--card)]/80 rounded-xl border border-[var(--divider)]">
                <Loader2 className="w-5 h-5 animate-spin text-accent-gold mr-2" />
                <span className="text-sm text-[var(--text-secondary)]">{t.loadingStatus}</span>
            </div>
        );
    }

    // Case 1: Fully connected and ready for payouts
    if (status?.onboardingComplete && status?.chargesEnabled) {
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                    <h4 className="text-green-500 font-bold text-sm">{t.paymentsConnected}</h4>
                    <p className="text-xs text-green-500/80 mt-1">
                        {t.paymentsConnectedDesc}
                    </p>
                </div>
            </div>
        );
    }

    // Case 2: Started but incomplete (Needs Action)
    if (status?.detailsSubmitted === false || (status?.chargesEnabled === false && !status.needsAccount)) {
        return (
            <div className="bg-[var(--card)]/80 rounded-xl p-4 border border-[var(--divider)] space-y-3">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                        <h4 className="text-[var(--text-primary)] font-bold text-sm">{t.actionRequired}</h4>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {t.actionRequiredDesc}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleConnect}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-lg bg-accent-gold text-black font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-50"
                >
                    {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <span>{t.completeVerification}</span>
                            <ExternalLink className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        );
    }

    // Case 3: Initial State (Not connected)
    return (
        <div className="bg-[var(--card)]/80 rounded-xl p-4 border border-[var(--divider)] space-y-3">
            <div className="flex items-start space-x-3">
                <CreditCard className="w-5 h-5 text-[var(--text-secondary)] mt-0.5" />
                <div>
                    <h4 className="text-[var(--text-primary)] font-bold text-sm">{t.getPaid}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {t.getPaidDesc}
                    </p>
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded-md">{error}</p>
            )}

            <button
                onClick={handleConnect}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-lg bg-[var(--text-primary)] text-[var(--surface)] font-bold text-sm flex items-center justify-center space-x-2 active:scale-95 transition-transform disabled:opacity-50"
            >
                {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        <span>{t.connectStripe}</span>
                        <ExternalLink className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
}
